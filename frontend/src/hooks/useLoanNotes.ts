import { useCurrentAccount, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { TIDE_CONFIG } from "@/tide_config";
import { useEffect, useState } from "react";

interface LoanNoteWithState {
  objectId: string;
  loan_id: string;
  principal: string;
  interest_rate_bps: string;
  coin_type_name: string;
  loanState: number; // 0=Active, 1=Repaid, 2=Liquidated
}

export function useLoanNotes() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const packageId = TIDE_CONFIG.PACKAGE_ID;
  const [notesWithState, setNotesWithState] = useState<LoanNoteWithState[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);

  // LoanNotes are owned objects, so we can use getOwnedObjects
  const { data, isLoading, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: currentAccount?.address || "",
      filter: {
        StructType: `${packageId}::loan::LoanNote`,
      },
      options: {
        showContent: true,
      },
    },
    {
      enabled: !!currentAccount,
      refetchInterval: 5000, // Poll every 5s
    }
  );

  const notes = data?.data.map((obj) => {
    if (obj.data?.content?.dataType === "moveObject") {
      return {
        objectId: obj.data.objectId,
        ...obj.data.content.fields
      } as any;
    }
    return null;
  }).filter((note) => note !== null) || [];

  // Fetch loan states for each note
  useEffect(() => {
    async function fetchLoanStates() {
      if (notes.length === 0) {
        setNotesWithState([]);
        return;
      }

      setIsLoadingStates(true);
      try {
        const loanIds = notes.map((note: any) => {
          // loan_id might be nested as {id: "..."} or just string
          return typeof note.loan_id === 'object' ? note.loan_id.id : note.loan_id;
        });

        // Fetch all loan objects
        const loansResponse = await suiClient.multiGetObjects({
          ids: loanIds,
          options: { showContent: true },
        });

        // Build a map of loan_id -> state
        const stateMap: Record<string, number> = {};
        loansResponse.forEach((res) => {
          if (res.data?.content?.dataType === "moveObject") {
            const fields = (res.data.content as any).fields;
            stateMap[res.data.objectId] = parseInt(fields?.state || '0');
          }
        });

        // Merge state into notes
        const enrichedNotes = notes.map((note: any) => {
          const loanId = typeof note.loan_id === 'object' ? note.loan_id.id : note.loan_id;
          return {
            ...note,
            loanState: stateMap[loanId] ?? 0,
          };
        });

        setNotesWithState(enrichedNotes);
      } catch (err) {
        console.error("Error fetching loan states:", err);
        // Fallback: use notes without state
        setNotesWithState(notes.map((n: any) => ({ ...n, loanState: 0 })));
      } finally {
        setIsLoadingStates(false);
      }
    }

    fetchLoanStates();
  }, [notes.length, suiClient]);

  return {
    notes: notesWithState,
    isLoading: isLoading || isLoadingStates,
    refetch,
  };
}

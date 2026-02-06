import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { TIDE_CONFIG } from "@/tide_config";

export interface Loan {
    id: { id: string };
    borrower: string;
    principal: string;
    interest_rate_bps: string;
    ltv_bps: string;
    duraion_ms: string;
    start_time_ms: string;
    state: number; // 0=Active, 1=Repaid, 2=Liquidated
    collateral_balance: string;
}

export function useLoans() {
  const currentAccount = useCurrentAccount();
  const packageId = TIDE_CONFIG.PACKAGE_ID;

  // Query events to find loans created by this user
  // (In production, better to use an indexer or getOwnedObjects if loans were owned, but they are shared)
  // Since Loans are shared, we can query for LoanCreated events where borrower == user
  // Then fetch the loan objects
  
  const { data: events, isLoading: isEventsLoading } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${packageId}::loan::LoanCreated`,
      },
      limit: 50,
      order: "descending",
    },
    {
        enabled: !!currentAccount,
    }
  );

  // Filter events for current user
  const myLoanIds = events?.data
    .filter((e: any) => e.parsedJson?.borrower === currentAccount?.address)
    .map((e: any) => e.parsedJson?.loan_id) || [];

  // Fetch the actual loan objects to get current state
  const { data: loanObjects, isLoading: isObjectsLoading } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: myLoanIds,
      options: { showContent: true },
    },
    {
      enabled: myLoanIds.length > 0,
    }
  );
  
  const loans = loanObjects?.map((obj) => {
      if (obj.data?.content?.dataType === "moveObject") {
          return {
              objectId: obj.data.objectId,
              type: obj.data.content.type,
              ...obj.data.content.fields
          };
      }
      return null;
  }).filter(l => l !== null) as any[] || [];

  return {
    loans,
    isLoading: isEventsLoading || isObjectsLoading,
  };
}

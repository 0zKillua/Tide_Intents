import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { TIDE_CONFIG } from "@/tide_config";

export function useLoanNotes() {
  const currentAccount = useCurrentAccount();
  const packageId = TIDE_CONFIG.PACKAGE_ID;

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
    }
  );

  const notes = data?.data.map((obj) => {
    if (obj.data?.content?.dataType === "moveObject") {
      return {
          objectId: obj.data.objectId,
          ...obj.data.content.fields
      };
    }
    return null;
  }).filter((note) => note !== null) as any[] || [];

  return {
    notes,
    isLoading,
    refetch,
  };
}

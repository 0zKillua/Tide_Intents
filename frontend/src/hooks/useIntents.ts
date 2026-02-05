import { useSuiClientQuery } from "@mysten/dapp-kit";
import { TIDE_CONFIG } from "@/tide_config";

export function useIntents() {
  const packageId = TIDE_CONFIG.PACKAGE_ID;

  // 1. Query Creation Events to discover Objects
  const { data: lendEvents, isLoading: loadingLendEvents } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${packageId}::intents::LendOfferCreated`,
      },
    }
  );

  const { data: borrowEvents, isLoading: loadingBorrowEvents } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${packageId}::intents::BorrowRequestCreated`,
      },
    }
  );

  // Extract IDs (deduplicated)
  // Note: parsing requires knowing the event structure.
  // We assume event.parsedJson has 'offer_id' / 'request_id'
  const lendIds = lendEvents?.data.map((e: any) => e.parsedJson?.offer_id) || [];
  const borrowIds = borrowEvents?.data.map((e: any) => e.parsedJson?.request_id) || [];

  // 2. Fetch Live Object States (to check if active/deleted)
  const { data: lendObjects, isLoading: loadingLendObjs, refetch: refetchLend } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: lendIds,
      options: { showContent: true },
    },
    {
      enabled: lendIds.length > 0,
      // Poll every 5s to keep fresh
      refetchInterval: 5000, 
    }
  );

  const { data: borrowObjects, isLoading: loadingBorrowObjs, refetch: refetchBorrow } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: borrowIds,
      options: { showContent: true },
    },
    {
      enabled: borrowIds.length > 0,
      refetchInterval: 5000,
    }
  );

  // Filter out deleted or null objects
  const activeLendOffers = lendObjects?.map(res => res.data).filter(obj => obj && obj.content) || [];
  const activeBorrowRequests = borrowObjects?.map(res => res.data).filter(obj => obj && obj.content) || [];



  return {
    lendOffers: activeLendOffers,
    borrowRequests: activeBorrowRequests,
    isLoading: loadingLendEvents || loadingBorrowEvents || loadingLendObjs || loadingBorrowObjs,
    refetch: () => {
        refetchLend();
        refetchBorrow();
    }
  };
}

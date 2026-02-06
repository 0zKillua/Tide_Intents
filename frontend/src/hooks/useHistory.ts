import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { TIDE_CONFIG } from "@/tide_config";

interface HistoryEvent {
  type: string;
  timestamp: number;
  data: any;
  digest: string;
}

export function useHistory() {
  const currentAccount = useCurrentAccount();
  const packageId = TIDE_CONFIG.PACKAGE_ID;

  // Fetch LoanRepaid events (user as borrower)
  const { data: repaidEvents, isLoading: loadingRepaid } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${packageId}::loan::LoanRepaid`,
      },
      limit: 50,
      order: "descending",
    },
    {
      enabled: !!currentAccount,
      refetchInterval: 10000,
    }
  );

  // Fetch LoanCreated events
  const { data: createdEvents, isLoading: loadingCreated } = useSuiClientQuery(
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
      refetchInterval: 10000,
    }
  );

  // Fetch LoanClaimed events
  const { data: claimedEvents, isLoading: loadingClaimed } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${packageId}::loan::LoanClaimed`,
      },
      limit: 50,
      order: "descending",
    },
    {
      enabled: !!currentAccount,
      refetchInterval: 10000,
    }
  );

  // Filter events for current user and combine
  const userAddress = currentAccount?.address;

  const history: HistoryEvent[] = [];

  // Add repaid events
  repaidEvents?.data.forEach((event: any) => {
    const data = event.parsedJson;
    if (data?.borrower === userAddress) {
      history.push({
        type: "Loan Repaid",
        timestamp: parseInt(event.timestampMs || '0'),
        data: {
          principal: parseInt(data.principal || '0') / 1e6,
          interest: parseInt(data.interest_paid || '0') / 1e6,
          loanId: data.loan_id,
        },
        digest: event.id?.txDigest || '',
      });
    }
  });

  // Add created events
  createdEvents?.data.forEach((event: any) => {
    const data = event.parsedJson;
    if (data?.borrower === userAddress) {
      history.push({
        type: "Loan Created",
        timestamp: parseInt(event.timestampMs || '0'),
        data: {
          principal: parseInt(data.principal || '0') / 1e6,
          interestRate: parseInt(data.interest_rate_bps || '0') / 100,
          loanId: data.loan_id,
        },
        digest: event.id?.txDigest || '',
      });
    }
  });

  // Add claimed events (user as lender)
  claimedEvents?.data.forEach((event: any) => {
    const data = event.parsedJson;
    if (data?.lender === userAddress) {
      history.push({
        type: "Loan Claimed",
        timestamp: parseInt(event.timestampMs || '0'),
        data: {
          amount: parseInt(data.amount || '0') / 1e6,
          loanId: data.loan_id,
        },
        digest: event.id?.txDigest || '',
      });
    }
  });

  // Sort by timestamp descending
  history.sort((a, b) => b.timestamp - a.timestamp);

  return {
    history,
    isLoading: loadingRepaid || loadingCreated || loadingClaimed,
  };
}

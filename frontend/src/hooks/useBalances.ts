import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { TIDE_CONFIG } from "@/tide_config";

export function useBalances() {
  const currentAccount = useCurrentAccount();
  const address = currentAccount?.address;

  // Query all coins owned by the user
  const { data: allCoins, isLoading } = useSuiClientQuery(
    "getAllCoins",
    {
      owner: address || "",
    },
    {
      enabled: !!address,
    }
  );

  // Group and sum by coin type
  const balances: Record<string, { symbol: string; balance: number; decimals: number }> = {};

  if (allCoins?.data) {
    for (const coin of allCoins.data) {
      const type = coin.coinType;
      const balance = parseInt(coin.balance);

      // Match against our known types
      if (type === TIDE_CONFIG.COINS.USDC.TYPE) {
        balances.USDC = {
          symbol: "USDC",
          balance: (balances.USDC?.balance || 0) + balance / (10 ** TIDE_CONFIG.COINS.USDC.DECIMALS),
          decimals: TIDE_CONFIG.COINS.USDC.DECIMALS,
        };
      } else if (type === "0x2::sui::SUI") {
        balances.SUI = {
          symbol: "SUI",
          balance: (balances.SUI?.balance || 0) + balance / 1e9,
          decimals: 9,
        };
      }
    }
  }

  return {
    balances,
    isLoading,
  };
}

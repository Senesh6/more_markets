import { encodeFunctionData } from "viem";
import { ZeroAddress, MaxUint256, parseUnits, formatUnits } from "ethers";
import {
  readContract,
  readContracts,
  writeContract,
  getBalance,
  signTypedData,
  watchAsset,
  type GetBalanceReturnType,
  waitForTransactionReceipt,
  simulateContract,
} from "@wagmi/core";
import { config } from "./wagmi";
import { ERC20Abi } from "@/app/abi/ERC20Abi";
import { VaultsAbi } from "@/app/abi/VaultsAbi";
import { BundlerAbi } from "@/app/abi/BundlerAbi";
import { OracleAbi } from "@/app/abi/OracleAbi";
import { UrdAbi } from "@/app/abi/UrdAbi";
import {
  Market,
  MarketInfo,
  MarketParams,
  Position,
  GraphVault,
  GraphMarket,
  BorrowPosition,
  InvestmentData,
  IRewardClaim,
} from "../types";
import {
  contracts,
  initBalance,
  wflowInstance,
  marketsInstance,
  bundlerInstance,
  permit2Instance,
  apyfeedInstance,
  multicallInstance,
  loopstrategyInstance,
  Uint48Max,
  gasLimit,
  vaultIds,
  marketIds,
} from "./const";
import {
  getVaule,
  getVauleNum,
  getVauleBigint,
  getVauleBoolean,
  getVauleString,
  getVauleBigintList,
  getTokenInfo,
  toAssetsUp,
  isFlow,
  delay,
} from "./utils";

const chainId = config.chains[0].id;

const executeTransaction = async (
  multicallArgs: string[],
  value: bigint = BigInt(0),
  setGas: string = gasLimit
): Promise<string> => {
  const simulateResult = await simulateContract(config, {
    ...bundlerInstance,
    functionName: "multicall",
    args: [multicallArgs],
    value: value,
    gas: parseUnits(setGas, 6),
  });
  return await writeContract(config, simulateResult.request);
};

const addBundlerFunction = (
  multicallArgs: string[],
  functionName: string,
  args: any[]
): string[] => {
  multicallArgs.push(
    encodeFunctionData({
      abi: BundlerAbi,
      functionName,
      args,
    })
  );

  return multicallArgs;
};

const addWrapNative = (multicallArgs: string[], amount: bigint): string[] => {
  return addBundlerFunction(multicallArgs, "wrapNative", [amount]);
};

const addUnwrapNative = (
  multicallArgs: string[],
  account: string
): string[] => {
  multicallArgs = addBundlerFunction(multicallArgs, "unwrapNative", [
    MaxUint256,
  ]);
  return addBundlerFunction(multicallArgs, "nativeTransfer", [
    account,
    MaxUint256,
  ]);
};

export const getClaimedAmount = async (
  claimList: IRewardClaim[]
): Promise<IRewardClaim[]> => {
  const requestList = claimList.map((claimItem, key) => ({
    address: claimItem.urdAddress as `0x${string}`,
    abi: UrdAbi,
    functionName: "claimed",
    args: [claimItem.user, claimItem.rewardToken],
  }));

  const claimedResults = await readContracts(config, {
    contracts: requestList,
  });

  return claimedResults.map((claimedResult, key) => ({
    ...claimList[key],
    amount: claimedResult.result?.toString() || "0",
  }));
};

export const getTokenPairPrice = async (oracle: string): Promise<bigint> => {
  try {
    if (oracle == ZeroAddress) return BigInt(0);

    const pairPrice = await readContract(config, {
      address: oracle as `0x${string}`,
      abi: OracleAbi,
      functionName: "price",
    });

    return pairPrice as bigint;
  } catch {
    return BigInt(0);
  }
};

export const getLoopWithdraw = async (assets: bigint): Promise<bigint[]> => {
  const withdrawInfo = await readContract(config, {
    ...loopstrategyInstance,
    functionName: "expectedAmountsToWithdraw",
    args: [assets],
  });

  return withdrawInfo as unknown as bigint[];
};

export const getTokenPrice = async (token: string): Promise<number> => {
  try {
    const oracleContract = {
      address: getTokenInfo(contracts.WNATIVE).oracle as `0x${string}`,
      abi: OracleAbi,
    };

    let requestList = [
      {
        ...oracleContract,
        functionName: "decimals",
      },
      {
        ...oracleContract,
        functionName: "latestAnswer",
      },
    ];

    if (!isFlow(token)) {
      requestList.push({
        address: getTokenInfo(token).oracle as `0x${string}`,
        abi: OracleAbi,
        functionName: "price",
      });
    }

    const priceResult = await readContracts(config, {
      contracts: requestList,
    });

    const decimalVal = Number(priceResult[0].result);
    const answerVal = priceResult[1].result as bigint;

    const flowPrice = parseFloat(formatUnits(answerVal, decimalVal));
    if (isFlow(token)) return flowPrice;
    else {
      return (
        flowPrice * parseFloat(formatUnits(priceResult[2].result as bigint, 36))
      );
    }
  } catch {
    return 0;
  }
};

export const getTokenAllowance = async (
  token: string,
  wallet: string,
  spender: string
): Promise<bigint> => {
  return await readContract(config, {
    abi: ERC20Abi,
    address: token as `0x${string}`,
    functionName: "allowance",
    args: [wallet as `0x${string}`, spender as `0x${string}`],
  });
};

export const getBorrowedAmount = async (
  marketId: string,
  multiplier: bigint,
  shares: bigint
): Promise<bigint> => {
  if (shares > BigInt(0)) {
    const [totalBAMultiplier, totalBSMultiplier] = await readContracts(config, {
      contracts: [
        {
          ...marketsInstance,
          functionName: "totalBorrowAssetsForMultiplier",
          args: [marketId, multiplier],
        },
        {
          ...marketsInstance,
          functionName: "totalBorrowSharesForMultiplier",
          args: [marketId, multiplier],
        },
      ],
    });

    return toAssetsUp(
      shares,
      totalBAMultiplier.result as bigint,
      totalBSMultiplier.result as bigint
    );
  } else {
    return BigInt(0);
  }
};

export const getTokenPermit = async (args: any[]): Promise<bigint> => {
  const permitInfo = await readContract(config, {
    ...permit2Instance,
    functionName: "allowance",
    args,
  });

  const permitAmount = BigInt((permitInfo as any[])[0]);
  const permitExpiration = BigInt((permitInfo as any[])[1]);

  return permitExpiration >= BigInt(Math.floor(Date.now() / 1000))
    ? permitAmount
    : BigInt(0);
};

export const getTokenBallance = async (
  token: string,
  wallet: `0x${string}` | undefined,
  flowBal: boolean = true
): Promise<GetBalanceReturnType> => {
  const userBalance = wallet
    ? isFlow(token) && flowBal
      ? await getBalance(config, {
          address: wallet,
        })
      : await getBalance(config, {
          token: token as `0x${string}`,
          address: wallet,
        })
    : initBalance;

  return userBalance;
};

export const getPositions = async (
  account: string,
  marketIds: string[]
): Promise<Position[]> => {
  const contracts = marketIds.map((marketId) => {
    return {
      ...marketsInstance,
      functionName: "position",
      args: [marketId, account],
    };
  });

  const fetchedPositions = await readContracts(config, {
    contracts,
  });
  const positionDetails = fetchedPositions
    .map((fetchedPosition, ind) => {
      return {
        id: marketIds[ind],
        supplyShares: getVauleBigint(fetchedPosition, 0),
        borrowShares: getVauleBigint(fetchedPosition, 1),
        collateral: getVauleBigint(fetchedPosition, 2),
        lastMultiplier: getVauleBigint(fetchedPosition, 3),
        // debtTokenMissed: getVauleBigint(fetchedPosition, 4),
        // debtTokenGained: getVauleBigint(fetchedPosition, 5),
      } as Position;
    })
    .filter(
      (positionItem) =>
        positionItem.collateral > BigInt(0) ||
        positionItem.borrowShares > BigInt(0)
    );

  return positionDetails;
};

export const getPosition = async (
  account: string,
  marketId: string
): Promise<Position | null> => {
  const fetchedPosition = await readContract(config, {
    ...marketsInstance,
    functionName: "position",
    args: [marketId, account],
  });

  const positionItem = {
    id: marketId,
    supplyShares: BigInt((fetchedPosition as any[])[0]),
    borrowShares: BigInt((fetchedPosition as any[])[1]),
    collateral: BigInt((fetchedPosition as any[])[2]),
    lastMultiplier: BigInt((fetchedPosition as any[])[3]),
    // debtTokenMissed: BigInt((fetchedPosition as any[])[4]),
    // debtTokenGained: BigInt((fetchedPosition as any[])[5]),
  } as Position;

  return positionItem.collateral > BigInt(0) ||
    positionItem.borrowShares > BigInt(0)
    ? positionItem
    : null;
};

export const getMarketParams = async (
  marketId: string
): Promise<MarketParams> => {
  const params = await readContract(config, {
    ...marketsInstance,
    functionName: "idToMarketParams",
    args: [marketId as `0x${string}`],
  });

  return {
    isPremiumMarket: (params as any[])[0],
    loanToken: (params as any[])[1],
    collateralToken: (params as any[])[2],
    oracle: (params as any[])[3],
    irm: (params as any[])[4],
    lltv: (params as any[])[5],
    creditAttestationService: (params as any[])[6],
    irxMaxLltv: (params as any[])[7],
    categoryLltv: (params as any[])[8],
  } as MarketParams;
};

export const getMarketInfo = async (marketId: string): Promise<MarketInfo> => {
  const infos = await readContract(config, {
    ...marketsInstance,
    functionName: "market",
    args: [marketId as `0x${string}`],
  });

  return {
    totalSupplyAssets: (infos as any[])[0],
    totalSupplyShares: (infos as any[])[1],
    totalBorrowAssets: (infos as any[])[2],
    totalBorrowShares: (infos as any[])[3],
    lastUpdate: (infos as any[])[4],
    fee: (infos as any[])[5],
    premiumFee: (infos as any[])[6],
  } as MarketInfo;
};

export const getMarketData = async (marketId: string): Promise<Market> => {
  // const [configs, params, infos] = await readContracts(config, {
  const [params, infos] = await readContracts(config, {
    contracts: [
      // {
      //   ...vaultContract,
      //   functionName: "config",
      //   args: [marketId],
      // },
      {
        ...marketsInstance,
        functionName: "idToMarketParams",
        args: [marketId as `0x${string}`],
      },
      {
        ...marketsInstance,
        functionName: "market",
        args: [marketId as `0x${string}`],
      },
    ],
  });

  return {
    // config: {
    //   cap: getVauleBigint(configs, 0),
    //   enabled: getVauleBoolean(configs, 1),
    //   removableAt: getVauleBigint(configs, 2),
    // },
    params: {
      isPremiumMarket: getVauleBoolean(params, 0),
      loanToken: getVauleString(params, 1),
      collateralToken: getVauleString(params, 2),
      oracle: getVauleString(params, 3),
      irm: getVauleString(params, 4),
      lltv: getVauleBigint(params, 5),
      creditAttestationService: getVauleString(params, 6),
      irxMaxLltv: getVauleBigint(params, 7),
      categoryLltv: getVauleBigintList(params, 8),
    },
    info: {
      totalSupplyAssets: getVauleBigint(infos, 0),
      totalSupplyShares: getVauleBigint(infos, 1),
      totalBorrowAssets: getVauleBigint(infos, 2),
      totalBorrowShares: getVauleBigint(infos, 3),
      lastUpdate: getVauleBigint(infos, 4),
      fee: getVauleBigint(infos, 5),
      premiumFee: getVauleBigint(infos, 6),
    },
  } as Market;
};

export const getVaultDetail = async (
  vaultAddress: string,
  functionName: string,
  args: any[]
) => {
  const vaultContract = {
    address: vaultAddress as `0x${string}`,
    abi: VaultsAbi,
  };

  return await readContract(config, {
    ...vaultContract,
    functionName: functionName,
    args,
  });
};

export const getPermitNonce = async (args: any[]): Promise<number> => {
  const nonceInfo = await readContract(config, {
    ...permit2Instance,
    functionName: "allowance",
    args,
  });

  return Number((nonceInfo as any[])[2]);
};

export const getAuthorizeNonce = async (account: string): Promise<bigint> => {
  const nonceInfo = await readContract(config, {
    ...marketsInstance,
    functionName: "nonce",
    args: [account],
  });

  return nonceInfo as bigint;
};

export const checkAuthorized = async (account: string): Promise<boolean> => {
  const authorizeInfo = await readContract(config, {
    ...marketsInstance,
    functionName: "isAuthorized",
    args: [account, contracts.MORE_BUNDLER],
  });

  return authorizeInfo as boolean;
};

export const getVaultNonce = async (
  vaultAddress: `0x${string}`,
  account: string
): Promise<bigint> => {
  const vaultContract = {
    address: vaultAddress,
    abi: VaultsAbi,
  };

  const nonceInfo = await readContract(config, {
    ...vaultContract,
    functionName: "nonces",
    args: [account],
  });

  return nonceInfo as bigint;
};

export const getVaultSupplyRate = async (
  vaultAddress: string
): Promise<bigint> => {
  const aprInfo = await readContract(config, {
    ...apyfeedInstance,
    functionName: "getVaultSupplyRate",
    args: [vaultAddress],
  });

  return aprInfo as bigint;
};

export const getMarketSupplyRate = async (
  marketParams: MarketParams
): Promise<bigint> => {
  const aprInfo = await readContract(config, {
    ...apyfeedInstance,
    functionName: "getMarketSupplyRate",
    args: [
      contracts.MORE_MARKETS,
      [
        marketParams.isPremiumMarket,
        marketParams.loanToken,
        marketParams.collateralToken,
        marketParams.oracle,
        marketParams.irm,
        marketParams.lltv,
        marketParams.creditAttestationService,
        marketParams.irxMaxLltv,
        marketParams.categoryLltv,
      ],
    ],
  });

  return aprInfo as bigint;
};

export const getMarketBorrowRate = async (
  marketParams: MarketParams
): Promise<bigint> => {
  const aprInfo = await readContract(config, {
    ...apyfeedInstance,
    functionName: "getBorrowRate",
    args: [
      contracts.MORE_MARKETS,
      [
        marketParams.isPremiumMarket,
        marketParams.loanToken,
        marketParams.collateralToken,
        marketParams.oracle,
        marketParams.irm,
        marketParams.lltv,
        marketParams.creditAttestationService,
        marketParams.irxMaxLltv,
        marketParams.categoryLltv,
      ],
    ],
  });

  return aprInfo as bigint;
};

export const waitForTransaction = async (txHash: string) => {
  const updatedTxHash = txHash.substring(0, 2) == "0x" ? txHash : "0x" + txHash;
  await waitForTransactionReceipt(config, {
    hash: updatedTxHash as `0x${string}`,
  });
};

export const addNewToken = async (
  token: string,
  symbol: string,
  decimals: number
) => {
  await watchAsset(config, {
    type: "ERC20",
    options: {
      address: token,
      symbol,
      decimals,
    },
  });
};

export const setTokenAllowance = async (
  token: string,
  spender: string,
  amount: bigint
) => {
  const txHash = await writeContract(config, {
    address: token as `0x${string}`,
    abi: ERC20Abi,
    functionName: "approve",
    args: [spender as `0x${string}`, amount],
  });
  await waitForTransaction(txHash);
};

export const setTokenPermit = async (
  token: string,
  amount: bigint,
  nonce: number,
  spender: string,
  deadline: bigint
): Promise<string> => {
  const result = await signTypedData(config, {
    types: {
      PermitDetails: [
        {
          name: "token",
          type: "address",
        },
        {
          name: "amount",
          type: "uint160",
        },
        {
          name: "expiration",
          type: "uint48",
        },
        {
          name: "nonce",
          type: "uint48",
        },
      ],
      PermitSingle: [
        { name: "details", type: "PermitDetails" },
        { name: "spender", type: "address" },
        { name: "sigDeadline", type: "uint256" },
      ],
    },
    primaryType: "PermitSingle",
    message: {
      details: {
        token: token as `0x${string}`,
        amount: amount,
        expiration: Uint48Max,
        nonce,
      },
      spender: spender as `0x${string}`,
      sigDeadline: deadline,
    },
    domain: {
      verifyingContract: contracts.PERMIT2 as `0x${string}`,
      chainId: chainId,
      name: "Permit2",
    },
  });

  return result;
};

export const doMarketsAuthorize = async () => {
  const txHash = await writeContract(config, {
    ...marketsInstance,
    functionName: "setAuthorization",
    args: [contracts.MORE_BUNDLER, true],
  });
  await waitForTransaction(txHash);
};

export const setMarketsAuthorize = async (
  account: `0x${string}`,
  nonce: bigint,
  deadline: bigint
): Promise<string> => {
  const result = await signTypedData(config, {
    types: {
      Authorization: [
        { name: "authorizer", type: "address" },
        { name: "authorized", type: "address" },
        { name: "isAuthorized", type: "bool" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Authorization",
    message: {
      authorizer: account,
      authorized: contracts.MORE_BUNDLER as `0x${string}`,
      isAuthorized: true,
      nonce,
      deadline,
    },
    domain: {
      verifyingContract: contracts.MORE_MARKETS as `0x${string}`,
      chainId: chainId,
    },
  });

  return result;
};

export const setVaultPermit = async (
  vaultName: string,
  account: `0x${string}`,
  vaultAddress: string,
  amount: bigint,
  nonce: bigint,
  deadline: bigint
): Promise<string> => {
  const result = await signTypedData(config, {
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    message: {
      owner: account,
      spender: contracts.MORE_BUNDLER as `0x${string}`,
      value: amount,
      nonce,
      deadline,
    },
    domain: {
      verifyingContract: vaultAddress as `0x${string}`,
      chainId: chainId,
      name: vaultName,
      version: "1",
    },
  });

  return result;
};

export const depositToVaults = async (
  vaultAddress: string,
  asset: string,
  account: string,
  signhash: string,
  deadline: bigint,
  amount: bigint,
  nonce: number,
  useFlow: boolean,
  flowWallet: boolean,
  easyMode: boolean
): Promise<string> => {
  let multicallArgs: string[] = [];
  if (useFlow) {
    multicallArgs = addWrapNative(multicallArgs, amount);
  } else if (flowWallet) {
    // encode transferFrom
    multicallArgs = addBundlerFunction(multicallArgs, "erc20TransferFrom", [
      asset,
      amount,
    ]);
  } else {
    // encode approve2
    if (signhash.length > 0)
      multicallArgs = addBundlerFunction(multicallArgs, "approve2", [
        [[asset, amount, Uint48Max, nonce], contracts.MORE_BUNDLER, deadline],
        signhash,
        false,
      ]);

    // encode transferFrom2
    multicallArgs = addBundlerFunction(multicallArgs, "transferFrom2", [
      asset,
      amount,
    ]);
  }

  // encode erc4626Deposit
  multicallArgs = addBundlerFunction(multicallArgs, "erc4626Deposit", [
    vaultAddress,
    amount,
    0,
    account,
  ]);
  return await executeTransaction(
    multicallArgs,
    useFlow ? amount : BigInt(0),
    easyMode ? "5" : gasLimit
  );
};

export const withdrawFromVaults = async (
  account: string,
  amount: bigint,
  deadline: bigint,
  signhash: string,
  authHash: string,
  authNonce: bigint,
  useShare: boolean,
  item: InvestmentData
): Promise<string> => {
  const { vaultId: vaultAddress, userShares, assetAddress } = item;
  let multicallArgs: string[] = [];

  // authorize
  if (authHash.length > 0) {
    const r1 = authHash.slice(0, 66);
    const s1 = "0x" + authHash.slice(66, 130);
    const v1 = "0x" + authHash.slice(130, 132);

    multicallArgs = addBundlerFunction(
      multicallArgs,
      "morphoSetAuthorizationWithSig",
      [
        [account, contracts.MORE_BUNDLER, true, authNonce, deadline],
        [v1, r1, s1],
        false,
      ]
    );
  }

  if (signhash.length > 0) {
    const r = signhash.slice(0, 66);
    const s = "0x" + signhash.slice(66, 130);
    const v = "0x" + signhash.slice(130, 132);

    // encode permit
    multicallArgs = addBundlerFunction(multicallArgs, "permit", [
      vaultAddress,
      MaxUint256,
      deadline,
      v,
      r,
      s,
      false,
    ]);
  }

  const flowVault = isFlow(assetAddress);
  const receiverAddr = flowVault ? contracts.MORE_BUNDLER : account;

  // encode erc4626Withdraw
  multicallArgs = addBundlerFunction(
    multicallArgs,
    useShare ? "erc4626Redeem" : "erc4626Withdraw",
    useShare
      ? [vaultAddress, userShares, 0, receiverAddr, account]
      : [vaultAddress, amount, MaxUint256, receiverAddr, account]
  );

  // unwrap and transfer if flow
  if (flowVault) multicallArgs = addUnwrapNative(multicallArgs, account);
  return await executeTransaction(multicallArgs);
};

export const supplycollateralAndBorrow = async (
  authHash: string,
  authNonce: bigint,
  account: string,
  signhash: string,
  deadline: bigint,
  supplyAmount: bigint,
  borrowAmount: bigint,
  nonce: number,
  onlyBorrow: boolean,
  flowWallet: boolean,
  item: BorrowPosition
): Promise<string> => {
  let multicallArgs: string[] = [];
  const { marketParams, inputToken, borrowedToken } = item;
  const { id: supplyAsset } = inputToken;
  const { id: borrowAsset } = borrowedToken;

  // authorize
  if (authHash.length > 0) {
    const r1 = authHash.slice(0, 66);
    const s1 = "0x" + authHash.slice(66, 130);
    const v1 = "0x" + authHash.slice(130, 132);

    multicallArgs = addBundlerFunction(
      multicallArgs,
      "morphoSetAuthorizationWithSig",
      [
        [account, contracts.MORE_BUNDLER, true, authNonce, deadline],
        [v1, r1, s1],
        false,
      ]
    );
  }

  const supplyFlow = isFlow(supplyAsset);
  if (!onlyBorrow) {
    if (supplyFlow) {
      multicallArgs = addWrapNative(multicallArgs, supplyAmount);
    } else if (flowWallet) {
      multicallArgs = addBundlerFunction(multicallArgs, "erc20TransferFrom", [
        supplyAsset,
        supplyAmount,
      ]);
    } else {
      // encode approve2
      if (signhash.length > 0)
        multicallArgs = addBundlerFunction(multicallArgs, "approve2", [
          [
            [supplyAsset, supplyAmount, Uint48Max, nonce],
            contracts.MORE_BUNDLER,
            deadline,
          ],
          signhash,
          false,
        ]);

      // encode transferFrom2
      multicallArgs = addBundlerFunction(multicallArgs, "transferFrom2", [
        supplyAsset,
        supplyAmount,
      ]);
    }

    // encode morphoSupplyCollateral
    multicallArgs = addBundlerFunction(
      multicallArgs,
      "morphoSupplyCollateral",
      [
        [
          marketParams.isPremiumMarket,
          marketParams.loanToken,
          marketParams.collateralToken,
          marketParams.oracle,
          marketParams.irm,
          marketParams.lltv,
          marketParams.creditAttestationService,
          marketParams.irxMaxLltv,
          marketParams.categoryLltv,
        ],
        supplyAmount,
        account,
        "",
      ]
    );
  }

  const borroFlow = isFlow(borrowAsset);
  // encode morphoBorrow
  multicallArgs = addBundlerFunction(multicallArgs, "morphoBorrow", [
    [
      marketParams.isPremiumMarket,
      marketParams.loanToken,
      marketParams.collateralToken,
      marketParams.oracle,
      marketParams.irm,
      marketParams.lltv,
      marketParams.creditAttestationService,
      marketParams.irxMaxLltv,
      marketParams.categoryLltv,
    ],
    borrowAmount,
    0,
    MaxUint256,
    borroFlow ? contracts.MORE_BUNDLER : account,
  ]);

  if (borroFlow) multicallArgs = addUnwrapNative(multicallArgs, account);
  return await executeTransaction(
    multicallArgs,
    supplyFlow ? supplyAmount : BigInt(0)
  );
};

export const repayLoanViaMarkets = async (
  account: string,
  repayAmount: bigint,
  useShare: boolean,
  item: BorrowPosition
): Promise<string> => {
  const { marketParams, borrowedToken } = item;

  if (isFlow(borrowedToken.id)) {
    let multicallArgs: string[] = [];

    const flowAmount = useShare
      ? (await getBorrowedAmount(
          item.id,
          item.lastMultiplier,
          item.borrowShares
        )) + parseUnits("0.01")
      : repayAmount;

    // wrap
    multicallArgs = addWrapNative(multicallArgs, flowAmount);

    // then repay
    multicallArgs = addBundlerFunction(multicallArgs, "morphoRepay", [
      [
        marketParams.isPremiumMarket,
        marketParams.loanToken,
        marketParams.collateralToken,
        marketParams.oracle,
        marketParams.irm,
        marketParams.lltv,
        marketParams.creditAttestationService,
        marketParams.irxMaxLltv,
        marketParams.categoryLltv,
      ],
      useShare ? 0 : repayAmount,
      useShare ? item.borrowShares : 0,
      useShare ? MaxUint256 : 0,
      account,
      "",
    ]);

    // then unwarp and transfer remaing flow
    if (useShare) multicallArgs = addUnwrapNative(multicallArgs, account);

    return await executeTransaction(multicallArgs, flowAmount);
  } else {
    const simulateResult = await simulateContract(config, {
      ...marketsInstance,
      functionName: "repay",
      args: [
        [
          marketParams.isPremiumMarket,
          marketParams.loanToken,
          marketParams.collateralToken,
          marketParams.oracle,
          marketParams.irm,
          marketParams.lltv,
          marketParams.creditAttestationService,
          marketParams.irxMaxLltv,
          marketParams.categoryLltv,
        ],
        useShare ? 0 : repayAmount,
        useShare ? item.borrowShares : 0,
        account,
        "",
      ],
      gas: parseUnits(gasLimit, 6),
    });

    return await writeContract(config, simulateResult.request);
  }
};

export const repayLoanToMarkets = async (
  account: string,
  repayAmount: bigint,
  nonce: number,
  deadline: bigint,
  signhash: string,
  useShare: boolean,
  item: BorrowPosition
): Promise<string> => {
  let multicallArgs: string[] = [];
  const marketParams = item.marketParams;
  const repayToken = item.borrowedToken.id;

  // encode approve2
  multicallArgs = addBundlerFunction(multicallArgs, "approve2", [
    [
      [repayToken, repayAmount, Uint48Max, nonce],
      contracts.MORE_BUNDLER,
      deadline,
    ],
    signhash,
    false,
  ]);

  // encode transferFrom2
  multicallArgs = addBundlerFunction(multicallArgs, "transferFrom2", [
    repayToken,
    repayAmount,
  ]);

  // encode morphoRepay
  multicallArgs = addBundlerFunction(multicallArgs, "morphoRepay", [
    [
      marketParams.isPremiumMarket,
      marketParams.loanToken,
      marketParams.collateralToken,
      marketParams.oracle,
      marketParams.irm,
      marketParams.lltv,
      marketParams.creditAttestationService,
      marketParams.irxMaxLltv,
      marketParams.categoryLltv,
    ],
    useShare ? 0 : repayAmount,
    useShare ? item.borrowShares : 0,
    0,
    account,
    "",
  ]);
  return await executeTransaction(multicallArgs);
};

export const supplyCollateral = async (
  supplyAsset: string,
  account: string,
  signhash: string,
  deadline: bigint,
  supplyAmount: bigint,
  nonce: number,
  flowWallet: boolean,
  marketParams: MarketParams
): Promise<string> => {
  let multicallArgs: string[] = [];
  const supplyFlow = isFlow(supplyAsset);

  if (supplyFlow) {
    multicallArgs = addWrapNative(multicallArgs, supplyAmount);
  } else if (flowWallet) {
    // encode transferFrom
    multicallArgs = addBundlerFunction(multicallArgs, "erc20TransferFrom", [
      supplyAsset,
      supplyAmount,
    ]);
  } else {
    // encode approve2
    if (signhash.length > 0) {
      multicallArgs = addBundlerFunction(multicallArgs, "approve2", [
        [
          [supplyAsset, supplyAmount, Uint48Max, nonce],
          contracts.MORE_BUNDLER,
          deadline,
        ],
        signhash,
        false,
      ]);
    }

    // encode transferFrom2
    multicallArgs = addBundlerFunction(multicallArgs, "transferFrom2", [
      supplyAsset,
      supplyAmount,
    ]);
  }

  // encode morphoSupplyCollateral
  multicallArgs = addBundlerFunction(multicallArgs, "morphoSupplyCollateral", [
    [
      marketParams.isPremiumMarket,
      marketParams.loanToken,
      marketParams.collateralToken,
      marketParams.oracle,
      marketParams.irm,
      marketParams.lltv,
      marketParams.creditAttestationService,
      marketParams.irxMaxLltv,
      marketParams.categoryLltv,
    ],
    supplyAmount,
    account,
    "",
  ]);
  return await executeTransaction(
    multicallArgs,
    supplyFlow ? supplyAmount : BigInt(0)
  );
};

export const withdrawCollateral = async (
  marketParams: MarketParams,
  amount: bigint,
  account: string,
  supplyToken: string
) => {
  let multicallArgs: string[] = [];
  const supplyflow = isFlow(supplyToken);

  // encode morphoWithdrawCollateral
  multicallArgs = addBundlerFunction(
    multicallArgs,
    "morphoWithdrawCollateral",
    [
      [
        marketParams.isPremiumMarket,
        marketParams.loanToken,
        marketParams.collateralToken,
        marketParams.oracle,
        marketParams.irm,
        marketParams.lltv,
        marketParams.creditAttestationService,
        marketParams.irxMaxLltv,
        marketParams.categoryLltv,
      ],
      amount,
      supplyflow ? contracts.MORE_BUNDLER : account,
    ]
  );

  if (supplyflow) multicallArgs = addUnwrapNative(multicallArgs, account);
  return await executeTransaction(multicallArgs);
};

export const doClaimReward = async (
  claimList: IRewardClaim[],
  isFlowWallet: boolean
) => {
  if (isFlowWallet) {
    for (const claimItem of claimList) {
      const simulateResult = await simulateContract(config, {
        address: claimItem.urdAddress as `0x${string}`,
        abi: UrdAbi,
        functionName: "claim",
        args: [
          claimItem.user as `0x${string}`,
          claimItem.rewardToken as `0x${string}`,
          BigInt(claimItem.amount),
          claimItem.proof as `0x${string}`[],
        ],
        gas: parseUnits(gasLimit, 6),
      });
      await writeContract(config, simulateResult.request);
      await delay(2);
    }
  } else {
    const multicallArgs = claimList.map((claimItem) => ({
      target: claimItem.urdAddress,
      callData: encodeFunctionData({
        abi: UrdAbi,
        functionName: "claim",
        args: [
          claimItem.user as `0x${string}`,
          claimItem.rewardToken as `0x${string}`,
          BigInt(claimItem.amount),
          claimItem.proof as `0x${string}`[],
        ],
      }),
    }));

    const simulateResult = await simulateContract(config, {
      ...multicallInstance,
      functionName: "aggregate",
      args: [multicallArgs],
      gas: parseUnits(gasLimit, 6),
    });
    await writeContract(config, simulateResult.request);
  }
};

export const wrapFlow = async (flowAmount: bigint) => {
  const simulateResult = await simulateContract(config, {
    ...wflowInstance,
    functionName: "deposit",
    value: flowAmount,
  });
  await writeContract(config, simulateResult.request);
};

export const unwrapWFlow = async (wflowAmount: bigint) => {
  const simulateResult = await simulateContract(config, {
    ...wflowInstance,
    functionName: "withdraw",
    args: [wflowAmount],
  });
  await writeContract(config, simulateResult.request);
};

export const loopstrategyWithdraw = async (
  useShare: boolean,
  account: `0x${string}`,
  amount: bigint
): Promise<string> => {
  const simulateResult = await simulateContract(config, {
    ...loopstrategyInstance,
    functionName: useShare ? "redeem" : "withdraw",
    args: [amount, account, account],
  });
  return await writeContract(config, simulateResult.request);
};

// ******************************************
export const fetchVaults = async (): Promise<GraphVault[]> => {
  const promises = vaultIds.map(async (vaultId: string) => {
    const vaultContract = {
      address: vaultId as `0x${string}`,
      abi: VaultsAbi,
    };

    const vaultInfos = await readContracts(config, {
      contracts: [
        {
          ...vaultContract,
          functionName: "name",
        },
        {
          ...vaultContract,
          functionName: "curator",
        },
        {
          ...vaultContract,
          functionName: "asset",
        },
        {
          ...vaultContract,
          functionName: "guardian",
        },
        {
          ...vaultContract,
          functionName: "supplyQueueLength",
        },
        {
          ...vaultContract,
          functionName: "timelock",
        },
      ],
    });

    const supplyQueueLen = getVauleNum(vaultInfos[4]);
    let supplyQueues: any[] = [];
    for (let ii = 0; ii < supplyQueueLen; ii++) {
      supplyQueues.push({
        ...vaultContract,
        functionName: "supplyQueue",
        args: [ii],
      });
    }
    const supplyMarketIds = await readContracts(config, {
      contracts: supplyQueues,
    });
    const queueIds = supplyMarketIds.map((supplyMarketId) => {
      return {
        market: {
          id: getVaule(supplyMarketId),
        },
      };
    });

    return {
      id: vaultId,
      supplyQueue: queueIds,
      name: vaultInfos[0].result,
      curator: {
        id: vaultInfos[1].result,
      },
      asset: {
        id: vaultInfos[2].result,
      },
      lastTotalAssets: "",
      totalShares: "",
      guardian: {
        id: vaultInfos[3].result == ZeroAddress ? "-" : "Guardian",
      },
      timelock: vaultInfos[5].result,
    } as GraphVault;
  });

  return await Promise.all(promises);
};

export const fetchVault = async (vaultId: string): Promise<GraphVault> => {
  const vaultContract = {
    address: vaultId as `0x${string}`,
    abi: VaultsAbi,
  };

  const vaultInfos = await readContracts(config, {
    contracts: [
      {
        ...vaultContract,
        functionName: "name",
      },
      {
        ...vaultContract,
        functionName: "curator",
      },
      {
        ...vaultContract,
        functionName: "asset",
      },
      {
        ...vaultContract,
        functionName: "guardian",
      },
      {
        ...vaultContract,
        functionName: "supplyQueueLength",
      },
      {
        ...vaultContract,
        functionName: "timelock",
      },
    ],
  });

  const supplyQueueLen = getVauleNum(vaultInfos[4]);
  let supplyQueues: any[] = [];
  for (let ii = 0; ii < supplyQueueLen; ii++) {
    supplyQueues.push({
      ...vaultContract,
      functionName: "supplyQueue",
      args: [ii],
    });
  }
  const supplyMarketIds = await readContracts(config, {
    contracts: supplyQueues,
  });
  const queueIds = supplyMarketIds.map((supplyMarketId) => {
    return {
      market: {
        id: getVaule(supplyMarketId),
      },
    };
  });

  return {
    id: vaultId,
    supplyQueue: queueIds,
    name: vaultInfos[0].result,
    curator: {
      id: vaultInfos[1].result,
    },
    asset: {
      id: vaultInfos[2].result,
    },
    lastTotalAssets: "",
    totalShares: "",
    guardian: {
      id: vaultInfos[3].result == ZeroAddress ? "-" : "Guardian",
    },
    timelock: vaultInfos[5].result,
  } as GraphVault;
};

export const fetchMarkets = async (): Promise<GraphMarket[]> => {
  const promises = marketIds.map(async (marketId) => {
    const marketParams = await getMarketParams(marketId);

    return {
      id: marketId,
      inputToken: {
        id: marketParams.collateralToken,
      },
      borrowedToken: {
        id: marketParams.loanToken,
      },
      lltv: marketParams.lltv,
      totalSupply: "",
      totalBorrow: "",
    } as GraphMarket;
  });

  return await Promise.all(promises);
};

export const fetchMarket = async (marketId: string): Promise<GraphMarket> => {
  const marketParams = await getMarketParams(marketId);

  return {
    id: marketId,
    inputToken: {
      id: marketParams.collateralToken,
    },
    borrowedToken: {
      id: marketParams.loanToken,
    },
    lltv: marketParams.lltv,
    totalSupply: "",
    totalBorrow: "",
  } as GraphMarket;
};
// ******************************************

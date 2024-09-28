"use client";

import { useAccount } from "wagmi";
import { parseUnits } from "ethers";
import React, { useState } from "react";
import TokenAmount from "../../token/TokenAmount";
import MoreButton from "../../moreButton/MoreButton";
import ListIconToken from "@/components/token/ListIconToken";
import PositionChangeToken from "@/components/token/PositionChangeToken";
import { BorrowPosition } from "@/types";
import { withdrawCollateral } from "@/utils/contract";
import { getTokenInfo, notifyError } from "@/utils/utils";

interface Props {
  amount: number;
  item: BorrowPosition;
  closeModal: () => void;
  validWithdraw: () => void;
  setTxHash: (hash: string) => void;
}

const VaultWithdrawBorrowPush: React.FC<Props> = ({
  item,
  amount,
  validWithdraw,
  closeModal,
  setTxHash,
}) => {
  const { address: userAddress } = useAccount();

  const [isLoading, setIsLoading] = useState(false);

  const collateralToken = getTokenInfo(item.inputToken.id);
  const loanToken = getTokenInfo(item.borrowedToken.id).symbol;
  const tokenAmount = parseUnits(amount.toString(), collateralToken.decimals);

  const handleWithdraw = async () => {
    if (userAddress) {
      setIsLoading(true);
      try {
        const txHash = await withdrawCollateral(
          item.marketParams,
          tokenAmount,
          userAddress
        );

        validWithdraw();
        setTxHash(txHash);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        notifyError(err);
      }
    }
  };

  return (
    <div className="more-bg-secondary rounded-[20px] h-full w-full px-4">
      <div className="mb-10 px-4 pt-5  text-xl">Review Transaction</div>
      <div className="flex items-center mb-10 px-8 gap-2">
        <ListIconToken
          iconNames={[item.inputToken.id, item.borrowedToken.id]}
          className="w-7 h-7"
        />
        <div className="text-l flex items-center'">
          {collateralToken.symbol} / {loanToken}
        </div>
      </div>

      <div className="more-bg-primary rounded-b-[5px] mt-[1px] py-8 px-8">
        <TokenAmount
          title="Withdraw Collateral"
          token={item.inputToken.id}
          amount={amount}
          ltv=""
          totalTokenAmount={amount}
        />
      </div>

      {/* <div className="more-bg-primary rounded-b-[5px] mt-[1px] py-8 px-8">
        <div className="text-grey pb-4"> Position Change </div>
        <PositionChangeToken
          title="Collateral"
          value={amount}
          token={collateralToken}
          value2={0}
        />
      </div> */}

      <div className="py-5 px-2">
        By confirming this transaction, you agree to the{" "}
        <a className="underline" href="#goto">
          Terms of Use
        </a>{" "}
        and the services provisions relating to the MORE Protocol Vault.
      </div>
      <div className="flex justify-end py-5  rounded-b-[20px] px-4">
        <div className="mr-5">
          <MoreButton
            className="text-2xl py-2"
            text="Cancel"
            onClick={closeModal}
            color="gray"
          />
        </div>
        <MoreButton
          className="text-2xl py-2"
          text="Withdraw Collateral"
          disabled={isLoading}
          onClick={handleWithdraw}
          color="primary"
        />
      </div>
    </div>
  );
};

export default VaultWithdrawBorrowPush;

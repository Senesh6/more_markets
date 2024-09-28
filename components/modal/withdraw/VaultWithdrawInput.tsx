"use client";

import React, { useState } from "react";
import { ArrowLongRightIcon } from "@heroicons/react/20/solid";
import MoreButton from "../../moreButton/MoreButton";
import InputTokenMax from "../../input/InputTokenMax";
import FormatTwoPourcentage from "@/components/tools/formatTwoPourcentage";
import { InvestmentData } from "@/types";
import { getTokenInfo } from "@/utils/utils";

interface Props {
  item: InvestmentData;
  useMax: boolean;
  closeModal: () => void;
  setUseMax: (useMax: boolean) => void;
  setAmount: (amount: number) => void;
}

const VaultWithdrawInput: React.FC<Props> = ({
  item,
  useMax,
  setAmount,
  closeModal,
  setUseMax,
}) => {
  const [withdraw, setWithdraw] = useState<number>();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal =
      event.target.value.length > 0
        ? parseFloat(event.target.value)
        : undefined;
    setWithdraw(inputVal);
    setUseMax(false);
  };

  const handleSetMax = (maxValue: number) => {
    setUseMax(true);
    setWithdraw(maxValue);
  };

  const handleWithdraw = () => {
    if (withdraw && (useMax || withdraw > 0)) {
      setAmount(withdraw);
    }
  };

  const tokenInfo = getTokenInfo(item.assetAddress);

  return (
    <div className="more-bg-secondary w-full modal-base">
      <div className="px-[28px] pt-[50px] pb-[30px] font-[16px]">
        <div className="text-[24px] mb-[40px] font-semibold">{item.vaultName}</div>
        <div className="text-[16px] mb-5">Withdraw {tokenInfo.symbol}</div>
        <div className="w-full flex justify-center">
          <InputTokenMax
            type="number"
            value={withdraw}
            onChange={handleInputChange}
            placeholder="0"
            token={item.assetAddress}
            balance={item.userDeposits}
            setMax={handleSetMax}
          />
        </div>
        <div className="text-right text-[16px] font-semibold more-text-gray px-4 mt-4">
          Your Deposits: {item.userDeposits} {tokenInfo.symbol}
        </div>
        <div className="flex justify-end mt-[40px]">
          <div className="mr-5">
            <MoreButton
              className="text-2xl py-2"
              text="Cancel"
              onClick={closeModal}
              color="grey"
            />
          </div>
          <MoreButton
            className="text-2xl py-2"
            text="Withdraw"
            onClick={() => handleWithdraw()}
            color="primary"
          />
        </div>
      </div>
      <div className="w-[50%] mx-15 flex justify-center mx-auto">
          <div className="glowing-text-primary !pb-0 w-full" />
        </div>
      <div className="flex items-center justify-between more-bg-primary rounded-b-[20px] px-[28px] pb-[40px] pt-[30px] text-[16px] font-normal">
        <div className="flex items-center gap-2">
          Withdraw <ArrowLongRightIcon className="w-4 h-4" /> Deposit APY /
          Projected Deposit APY
        </div>
        <FormatTwoPourcentage value={item.netAPY} />
      </div>
    </div>
  );
};

export default VaultWithdrawInput;

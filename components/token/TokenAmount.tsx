import React from "react";
import IconToken from "./IconToken";
import FormatTokenMillion from "../tools/formatTokenMillion";

interface Props {
  title: string;
  token: string;
  totalTokenAmount: number;
  amount: number;
}

const TokenAmount: React.FC<Props> = ({
  title,
  token,
  totalTokenAmount,
  amount,
}) => {
  return (
    <div className="flex flex-row justify-between items-center text-[16px]">
      <div className="text-[20px] font-normal">{title}</div>
      <div className="flex flex-row items-center">
        <IconToken tokenName={token} className="mr-4 w-6" />
        <FormatTokenMillion
          value={amount}
          token={token}
          totalValue={totalTokenAmount}
        />
      </div>
    </div>
  );
};

export default TokenAmount;

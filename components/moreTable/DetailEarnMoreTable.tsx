"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TableHeaderCell from "./MoreTableHeader";
import ListIconToken from "../token/ListIconToken";
import FormatTokenMillion from "../tools/formatTokenMillion";
import FormatPourcentage from "../tools/formatPourcentage";
import FormatTwoPourcentage from "../tools/formatTwoPourcentage";
import { VaultBreakdown } from "@/types";

interface Props {
  breakdowns: VaultBreakdown[];
}

const DetailEarnMoreTable: React.FC<Props> = ({ breakdowns }) => {
  const router = useRouter();
  const goToDetail = (item: VaultBreakdown) => {
    router.push("/borrow/" + item.id);
  };

  return (
    <div
      className="!overflow-x-visible rounded-2xl table-wrapper mb-16 more-table"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        position: "relative",
      }}
    >
      <table className="w-full rounded-2xl text-sm text-left table max-w-[1440px]">
        <thead
          className="bg-[#212121] h-20 text-white  text-xs"
          style={{ boxShadow: "inset 0 2px 10px 2px rgba(0, 0, 0, 0.2)" }}
        >
          <tr className="">
            <th style={{ width: "140px" }} className="p-6 rounded-tl-lg">
              <div className="flex justify-start">
                <TableHeaderCell
                  title="Allocation"
                  infoText="The percentage of total deposits allocated to the given market."
                />
              </div>
            </th>
            <th style={{ width: "200px" }} className="p-6 ">
              <div className="flex justify-start">
                <TableHeaderCell
                  title="Deposits"
                  infoText="The total amount of tokens currently lent in the given market."
                />
              </div>
            </th>
            <th style={{ width: "200px" }} className="p-6 ">
              <div className="flex justify-start">
                <TableHeaderCell
                  title="Collateral"
                  infoText="The token(s) that borrowers must lock in order to borrow funds."
                />
              </div>
            </th>
            <th style={{ width: "200px" }} className="p-6 ">
              <div className="flex justify-start">
                <TableHeaderCell
                  title="Liquidation LTV"
                  infoText="The standard maximum proportion of loan value to collateral value that borrowers must maintain in order to avoid liquidation."
                />
              </div>
            </th>
            {/* <th style={{ width: "200px" }}>
              <div className="flex justify-start">
                <TableHeaderCell
                  title="Credora Rating"
                  infoText="The weighted average and minimum S&P equivalent rating, issued by Credora for all premium borrowers across all markets in a vault. The rating represents the aggregate solvency of premium borrowers based on their holdings outside of MORE Markets."
                />
              </div>
            </th>
            <th style={{ width: "200px" }}>
              <div className="flex justify-start">
                <TableHeaderCell
                  title="Unsecured Borrow"
                  infoText="The total amount of credit (above the standard LTV)  issued by the given market to premium, rated borrowers."
                />
              </div>
            </th>
            <th style={{ width: "200px" }}>
              <div className="flex justify-start">
                <TableHeaderCell
                  title="Unsecured APY"
                  infoText="The annualized rate you earn specifically from premium borrowers that have borrowed above the standard LTV."
                />
              </div>
            </th> */}
          </tr>
        </thead>
        <tbody className="bg-transparent">
          {breakdowns.map((item, index, arr) => (
            <tr
              key={index}
              onClick={() => goToDetail(item)}
              style={
                index === arr.length - 1
                  ? {
                      borderBottomLeftRadius: "8px",
                      borderBottomRightRadius: "8px",
                    }
                  : undefined
              }
              className={`last:border-b-0 text-[14px] border border-[#202020] cursor-pointer ${
                index % 2 === 0 ? "bg-[#141414]" : "bg-[#191919]"
              }`}
            >
              <td className="p-6 items-center">
                <div className="flex justify-start">
                  <FormatPourcentage value={item.allowcation} multiplier={1} />
                </div>
              </td>
              <td className="p-6 items-center">
                <div className="flex justify-start">
                  <FormatTokenMillion
                    value={item.supply}
                    token={item.supplyToken}
                    totalValue={0}
                    inTable={true}
                  />
                </div>
              </td>
              <td className="p-6 items-center">
                <div className="flex justify-start">
                  <ListIconToken
                    className="w-8 h-8 "
                    iconNames={[item.collateral]}
                  />
                </div>
              </td>

              <td className="p-6 items-center">
                <div className="flex justify-start">
                  <FormatTwoPourcentage value={item.lltv} value2={item.lltv2} />
                </div>
              </td>

              {/* <td className="py-4  items-center h-full">
                <div className="py-4 flex justify-start">{item.credora}</div>
              </td>

              <td className="py-4  items-center h-full">
                <FormatTokenMillion
                  value={item.unsecuredBorrowAmount}
                  token={item.supplyCurrency}
                  totalValue={item.unsecuredBorrowValue}
                  inTable={true}
                />
              </td>

              <td className="py-4 px-6 items-center h-full">
                <div className="flex justify-start">
                  <FormatPourcentage
                    value={item.unsecuredAPY}
                  ></FormatPourcentage>
                </div>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DetailEarnMoreTable;

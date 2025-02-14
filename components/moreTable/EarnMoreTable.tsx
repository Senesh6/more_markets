"use client";

import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import TableHeaderCell from "./MoreTableHeader";
import ButtonDialog from "../buttonDialog/buttonDialog";
import VaultDeposit from "../modal/deposit/VaultDeposit";
import IconToken from "../token/IconToken";
import ListIconToken from "../token/ListIconToken";
import FormatPourcentage from "../tools/formatPourcentage";
import FormatTokenMillion from "../tools/formatTokenMillion";
import { InvestmentData, IInvestmentProps } from "@/types";
import IconCurator from "../token/IconCurator";
import HoverCardComp from "../hoverCard/HoverCard";

const EarnMoreTable: React.FC<IInvestmentProps> = ({
  investments,
  updateInfo,
}) => {
  const router = useRouter();
  const { address: userAddress } = useAccount();

  const goToDetail = (item: InvestmentData) => {
    router.push("/earn/" + item.vaultId);
  };

  return (
    <div className="overflow-x-scroll rounded-2xl table-wrapper mb-16 more-table">
      <table className="w-full  rounded-2xl text-sm text-left table max-w-[1440px] overflow-x-scroll">
        <thead
          className="bg-[#212121] h-20 text-white text-sm"
          style={{ boxShadow: "inset 0 2px 10px 2px rgba(0, 0, 0, 0.2)" }}
        >
          <tr>
            <th className="w-[400px] p-6">
              <TableHeaderCell
                title="Vault Name"
                infoText="The name given to the vault by the curator."
              />
            </th>
            <th className="w-[200px] p-6">
              <TableHeaderCell
                title="Deposit Token"
                infoText="The token(s) eligible for deposit into the vault and which are lent to borrowers in order to generate yield."
              />
            </th>
            <th className="w-[150px] p-6">
              <TableHeaderCell
                title="Net APY"
                infoText="The annualized return you earn on your deposited amount after all fees. This rate fluctuates in real-time based on supply and demand in the underlying markets."
              />
            </th>
            <th className="w-[200px] p-6">
              <div className="flex justify-start">
                <TableHeaderCell
                  title="Total Deposits"
                  infoText="The total amount of tokens that have already been deposited into the vault."
                />
              </div>
            </th>
            <th className="w-[200px] p-6">
              <TableHeaderCell
                title="Curator"
                infoText="The organization that manages the vault parameters such as included markets, allocations, caps and performance fees."
              />
            </th>
            <th className="w-[200px] p-6">
              <TableHeaderCell
                title="Collateral"
                infoText="The token(s) that borrowers must lock in order to borrow funds."
              />
            </th>
            {/* <th className="w-[200px]">
                  <div className="flex justify-start">
                    <TableHeaderCell
                      title="Unsecured"
                      infoText="The total amount of credit (above the standard LTV) issued by the all markets in the vault to premium, rated borrowers."
                    />
                  </div>
                </th> */}
            {userAddress && (
              <th
                style={{
                  right: 0,
                  backgroundColor: "#212121",
                  position: "static",
                  boxShadow: "inset 0 2px 0px 0px rgba(0, 0, 0, 0.2)",
                  padding: "1.5rem",
                }}
              />
            )}
          </tr>
        </thead>
        <tbody className="bg-transparent">
          {investments?.map((item, index, arr) => (
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
              <td className="p-6 items-center h-full">
                <div className="flex items-center">
                  <div className="mr-3 w-8 h-8">
                    <IconToken tokenName={item.assetAddress} />
                  </div>
                  {item.vaultName}
                </div>
              </td>
              <td className="p-6 items-center h-full">
                <div className="flex items-center">
                  <IconToken
                    className="mr-3 w-8 h-8"
                    tokenName={item.assetAddress}
                    showSymbol={true}
                  />
                </div>
              </td>
              <td className="p-6 items-center h-full">
                <div className="flex gap-1 justify-start items-center">
                  <div className="mr-3">
                    <FormatPourcentage
                      value={item.netAPY.total_apy}
                      multiplier={1}
                    />
                  </div>
                  {item.programs.length > 0 && (
                    <HoverCardComp apy={item.netAPY} />
                  )}
                </div>
              </td>
              <td className="p-6 items-left h-full">
                <FormatTokenMillion
                  align={true}
                  value={item.totalDeposits}
                  token={item.assetAddress}
                  totalValue={0}
                  inTable={true}
                />
              </td>
              <td className="p-6 items-center h-full">
                <div className="items-center flex">
                  <IconCurator curator={item.curator} />
                </div>
              </td>
              <td className="p-6 items-center h-full">
                <ListIconToken
                  className="w-8 h-8"
                  iconNames={item.collateral}
                />
              </td>
              {/* <td className="py-4 px-6 items-center h-full">
                    <FormatTokenMillion
                      value={item.totalDeposits}
                      token={item.tokenSymbol}
                      totalValue={item.unsecured}
                    />
                  </td> */}
              {userAddress && (
                <td
                  className="py-4 px-6 items-center justify-end h-full"
                  style={{
                    right: 0,
                    backgroundColor: index % 2 === 0 ? "#141414" : "#191919",
                  }}
                >
                  <div onClick={(event) => event.stopPropagation()}>
                    <ButtonDialog color="primary" buttonText="Deposit">
                      {(closeModal) => (
                        <div className="h-full w-full">
                          <VaultDeposit
                            updateInfo={updateInfo}
                            item={item}
                            closeModal={closeModal}
                          />
                        </div>
                      )}
                    </ButtonDialog>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EarnMoreTable;

import { CosmosEvent, CosmosMessage, CosmosTransaction } from "@subql/types-cosmos";
import { UserBond } from "../types";


export async function handleBondExecution(
  input: CosmosEvent
): Promise<void> {
  const { attributes } = input.event;
  const receiver = attributes.find((attr) => attr.key === "receiver")?.value;
  const ref = attributes.find((attr) => attr.key === "ref")?.value;
  if (!receiver) {
    logger.error("receiver not found in attributes");
    return;
  }
  if (!ref) {
    logger.warn("reg not found in attributes");
    return;
  }
  if (receiver === ref) {
    logger.warn("User cannot refer himself");
    return;
  }
  const prevUserBond = await UserBond.get(receiver.toString());
  if (prevUserBond) {
    logger.warn('User %s already bonded');
    return;
  }
  await (UserBond.create({
    id: receiver.toString(),
    ref: ref.toString(),
    height: BigInt(input.tx.block.header.height),
    ts: BigInt(input.tx.block.header.time.getTime())
  })).save();
  logger.info("!!!!!! Bonded %s to %s", receiver, ref);
}
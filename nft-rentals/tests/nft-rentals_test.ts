
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that only contract owner can create rentals",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;

        let block = chain.mineBlock([
            // Try creating rental as non-owner
            Tx.contractCall(
                "nft-rentals",
                "create-rental",
                [types.uint(1), types.uint(100), types.uint(5000)],
                wallet1.address
            ),
            // Create rental as owner
            Tx.contractCall(
                "nft-rentals",
                "create-rental",
                [types.uint(1), types.uint(100), types.uint(5000)],
                deployer.address
            )
        ]);

        assertEquals(block.receipts[0].result, `(err u100)`); // err-owner-only
        assertEquals(block.receipts[1].result, `(ok u0)`);
        assertEquals(block.height, 2);
    }
});

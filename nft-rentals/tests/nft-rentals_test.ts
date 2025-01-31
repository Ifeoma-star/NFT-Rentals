
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


Clarinet.test({
    name: "Ensure rental lifecycle (create, rent, end) works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const renter = accounts.get("wallet_1")!;

        // Create rental
        let block = chain.mineBlock([
            Tx.contractCall(
                "nft-rentals",
                "create-rental",
                [types.uint(1), types.uint(100), types.uint(5000)],
                deployer.address
            )
        ]);
        assertEquals(block.receipts[0].result, `(ok u0)`);

        // Rent NFT
        block = chain.mineBlock([
            Tx.contractCall(
                "nft-rentals",
                "rent-nft",
                [types.uint(0)],
                renter.address
            )
        ]);
        assertEquals(block.receipts[0].result, `(ok true)`);

        // Move blockchain forward
        chain.mineEmptyBlockUntil(105);

        // End rental
        block = chain.mineBlock([
            Tx.contractCall(
                "nft-rentals",
                "end-rental",
                [types.uint(0)],
                renter.address
            )
        ]);
        assertEquals(block.receipts[0].result, `(ok true)`);
    }
});

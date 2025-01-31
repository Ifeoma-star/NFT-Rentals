
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

Clarinet.test({
    name: "Ensure rental dispute and emergency return mechanism works",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const renter = accounts.get("wallet_1")!;

        let block = chain.mineBlock([
            // Create and rent NFT
            Tx.contractCall(
                "nft-rentals",
                "create-rental",
                [types.uint(1), types.uint(100), types.uint(5000)],
                deployer.address
            ),
            Tx.contractCall(
                "nft-rentals",
                "rent-nft",
                [types.uint(0)],
                renter.address
            ),
            // File dispute
            Tx.contractCall(
                "nft-rentals",
                "file-rental-dispute",
                [types.uint(0), types.utf8("Rental terms violated")],
                renter.address
            )
        ]);

        // Emergency return by contract owner
        block = chain.mineBlock([
            Tx.contractCall(
                "nft-rentals",
                "emergency-return-nft",
                [types.uint(0)],
                deployer.address
            )
        ]);
        assertEquals(block.receipts[0].result, `(ok true)`);
    }
});


Clarinet.test({
    name: "Ensure rental extension works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const renter = accounts.get("wallet_1")!;

        let block = chain.mineBlock([
            // Setup rental
            Tx.contractCall(
                "nft-rentals",
                "create-rental",
                [types.uint(1), types.uint(100), types.uint(5000)],
                deployer.address
            ),
            Tx.contractCall(
                "nft-rentals",
                "rent-nft",
                [types.uint(0)],
                renter.address
            )
        ]);

        // Extend rental
        block = chain.mineBlock([
            Tx.contractCall(
                "nft-rentals",
                "extend-rental",
                [types.uint(0), types.uint(500)],
                renter.address
            )
        ]);
        assertEquals(block.receipts[0].result, `(ok true)`);
    }
});

Clarinet.test({
    name: "Ensure rental rating system works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const renter = accounts.get("wallet_1")!;

        let block = chain.mineBlock([
            // Setup rental
            Tx.contractCall(
                "nft-rentals",
                "create-rental",
                [types.uint(1), types.uint(100), types.uint(5000)],
                deployer.address
            ),
            Tx.contractCall(
                "nft-rentals",
                "rent-nft",
                [types.uint(0)],
                renter.address
            )
        ]);

        // Rate rental
        block = chain.mineBlock([
            // Renter rates owner
            Tx.contractCall(
                "nft-rentals",
                "rate-rental",
                [
                    types.uint(0),
                    types.bool(true),
                    types.uint(5),
                    types.some(types.utf8("Great rental experience!"))
                ],
                renter.address
            ),
            // Owner rates renter
            Tx.contractCall(
                "nft-rentals",
                "rate-rental",
                [
                    types.uint(0),
                    types.bool(false),
                    types.uint(5),
                    types.some(types.utf8("Excellent renter!"))
                ],
                deployer.address
            )
        ]);
        assertEquals(block.receipts[0].result, `(ok true)`);
        assertEquals(block.receipts[1].result, `(ok true)`);
    }
});

Clarinet.test({
    name: "Ensure rental price updates and discounts work correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;

        let block = chain.mineBlock([
            // Create rental
            Tx.contractCall(
                "nft-rentals",
                "create-rental",
                [types.uint(1), types.uint(100), types.uint(5000)],
                deployer.address
            ),
            // Update price
            Tx.contractCall(
                "nft-rentals",
                "update-rental-price",
                [types.uint(0), types.uint(4000)],
                deployer.address
            ),
            // Offer discount
            Tx.contractCall(
                "nft-rentals",
                "offer-rental-discount",
                [types.uint(0), types.uint(1000)], // 10% discount
                deployer.address
            )
        ]);
        assertEquals(block.receipts[1].result, `(ok true)`);
        assertEquals(block.receipts[2].result, `(ok true)`);
    }
});


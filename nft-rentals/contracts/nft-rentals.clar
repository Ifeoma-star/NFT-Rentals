;; NFT Rental System

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-token-not-found (err u102))
(define-constant err-already-rented (err u103))
(define-constant err-not-rented (err u104))
(define-constant err-rental-expired (err u105))

(define-constant err-cannot-extend (err u106))
(define-constant err-invalid-extension (err u107))
(define-constant max-rental-extension-blocks u1000)

(define-constant marketplace-fee-bps u250) ;; 2.5% fee
(define-constant err-insufficient-funds (err u108))

;; Data Variables
(define-data-var next-rental-id uint u0)

;; Define the NFT
(define-non-fungible-token rented-nft uint)

;; Define Maps
(define-map rentals
  uint
  {
    owner: principal,
    renter: (optional principal),
    token-id: uint,
    rental-start: uint,
    rental-end: uint,
    price: uint
  }
)

(define-map token-rental uint uint)

(define-map rental-disputes
  uint
  {
    rental-id: uint,
    disputer: principal,
    reason: (string-utf8 100),
    status: (string-ascii 20)
  }
)

(define-map rental-ratings
  uint
  {
    rental-id: uint,
    renter-rating: (optional uint),
    owner-rating: (optional uint),
    renter-review: (optional (string-utf8 200)),
    owner-review: (optional (string-utf8 200))
  }
)
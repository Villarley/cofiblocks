"use client";

import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useAccount } from "@starknet-react/core";
import { useProvider } from "@starknet-react/core";
import { useAtom, useAtomValue } from "jotai";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cartItemsAtom, removeItemAtom } from "~/store/cartAtom";
import type { CartItem } from "~/store/cartAtom";
import {
	ContractsError,
	ContractsInterface,
	useCofiCollectionContract,
	useMarketplaceContract,
	useStarkContract,
} from "../../services/contractsInterface";
//import { api } from "~/trpc/server";

interface DeleteModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

function DeleteConfirmationModal({
	isOpen,
	onConfirm,
	onCancel,
}: DeleteModalProps) {
	const { t } = useTranslation();
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4 flex flex-col gap-4">
				<div className="h-[34px] flex items-center">
					<h3 className="text-2xl font-bold text-content-title leading-[34px]">
						{t("remove_confirmation_title")}
					</h3>
				</div>
				<button
					type="button"
					onClick={onConfirm}
					className="w-full h-[52px] bg-surface-secondary-default rounded-lg border border-surface-secondary-default flex justify-center items-center"
				>
					<span className="text-content-title text-base font-normal">
						{t("remove_confirmation_yes")}
					</span>
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="w-full h-[52px] bg-surface-primary-soft rounded-lg border border-surface-primary-soft flex justify-center items-center"
				>
					<span className="text-content-title text-base font-normal">
						{t("cancel")}
					</span>
				</button>
			</div>
		</div>
	);
}

export default function ShoppingCart() {
	const router = useRouter();
	const items = useAtomValue(cartItemsAtom);
	const [, removeItem] = useAtom(removeItemAtom);
	const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
	const { provider } = useProvider();
	const contract = new ContractsInterface(
		useAccount(),
		useCofiCollectionContract(),
		useMarketplaceContract(),
		useStarkContract(),
		provider,
	);
	const { t } = useTranslation();
	const handleRemove = (item: CartItem) => {
		setItemToDelete(item);
	};

	const confirmDelete = () => {
		if (itemToDelete) {
			removeItem(itemToDelete.id);
			setItemToDelete(null);
		}
	};

	const cancelDelete = () => {
		setItemToDelete(null);
	};

	const handleBuy = async () => {
		const token_ids = items.map((item) => item.tokenId);
		const token_amounts = items.map((item) => item.quantity);
		console.log("buying items", token_ids, token_amounts, totalPrice);
		try {
			const tx_hash = await contract.buy_product(
				token_ids,
				token_amounts,
				totalPrice,
			);
			alert(`Items bought successfully tx hash: ${tx_hash}`);
			for (const item of items) {
				removeItem(item.id);
			}
		} catch (error) {
			if (error instanceof ContractsError) {
				alert(error.message);
			}
			console.error("Error buying items:", error);
		}
	};

	const totalPrice = items.reduce(
		(total, item) => total + item.price * item.quantity,
		0,
	);

	return (
		<div className="max-w-md mx-auto bg-white min-h-screen">
			<div className="flex items-center gap-3 p-4 mb-8">
				<button
					type="button"
					onClick={() => router.back()}
					className="hover:bg-gray-100 p-1 rounded-full"
					aria-label="Go back"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</button>
				<h1 className="text-xl font-semibold">{t("shopping_cart_title")}</h1>
			</div>

			<div className="px-4">
				{items.length === 0 ? (
					<div className="py-8 text-center text-gray-500">
						{t("cart_empty_message")}
					</div>
				) : (
					items.map((item) => (
						<div
							key={item.id}
							className="py-4 flex items-center justify-between border-b"
						>
							<div className="flex items-center gap-3">
								<Image
									src={item.imageUrl}
									alt={item.name}
									width={48}
									height={48}
									className="rounded-lg object-cover bg-gray-100"
								/>
								<div>
									<h3 className="font-medium text-gray-900">{t(item.name)}</h3>
									<p className="text-gray-400 text-sm">
										{t("quantity_label")}: {item.quantity}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<span className="text-gray-900">
									{item.price * item.quantity} USD
								</span>
								<button
									type="button"
									onClick={() => handleRemove(item)}
									className="text-red-500 hover:text-red-600"
									aria-label={`Remove ${item.name} from cart`}
								>
									<TrashIcon className="h-5 w-5" />
								</button>
							</div>
						</div>
					))
				)}
			</div>

			{items.length > 0 && (
				<>
					<div className="px-4 py-4">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-gray-900">
								{t("total_label")}
							</span>
							<span className="font-semibold text-gray-900">
								{totalPrice} USD
							</span>
						</div>
					</div>
					<div className="fixed bottom-0 left-0 right-0 bg-white max-w-md mx-auto px-4 pb-4 pt-2">
						<button
							type="button"
							onClick={() => handleBuy()}
							className="w-full py-3.5 px-4 bg-surface-secondary-default rounded-lg border border-surface-secondary-defaul flex justify-center items-center"
						>
							<span className="text-[#1F1F20] text-base font-normal">
								{t("buy_button")}
							</span>
						</button>
					</div>
				</>
			)}

			<DeleteConfirmationModal
				isOpen={itemToDelete !== null}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
			/>
		</div>
	);
}

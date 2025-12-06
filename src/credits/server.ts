import {
  getAllCreditPackages as getAllCreditPackagesFromDb,
  productToCreditPackage,
} from '@/lib/product';
import type { CreditPackage } from './types';

/**
 * Get all credit packages, can be used in server components only (async function)
 * @returns Credit packages
 */
export async function getAllCreditPackages(): Promise<CreditPackage[]> {
  const products = await getAllCreditPackagesFromDb();
  return products
    .filter((p) => p.stripePriceId !== null) // 过滤掉没有 priceId 的产品
    .map(productToCreditPackage);
}

/**
 * Get credit package by id, can be used in server components only (async function)
 * @param id - Credit package id (product name)
 * @returns Credit package
 */
export async function getCreditPackageById(
  id: string
): Promise<CreditPackage | undefined> {
  const packages = await getAllCreditPackages();
  return packages.find((pkg) => pkg.id === id);
}

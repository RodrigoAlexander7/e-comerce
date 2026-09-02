"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPersistedStore } from "@/lib/storage/persisted-store";
import type { IdentificationType, PaymentMethod } from "@/lib/api/types";

const STORAGE_KEY = "atlas-sport:checkout:v1";

export interface AddressForm {
  country: string;
  state: string;
  city: string;
  district: string;
  street: string;
  apartment: string;
}

export interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  idType: IdentificationType;
  idNumber: string;

  needsInvoice: boolean;
  businessName: string;
  ruc: string;

  shippingAddress: AddressForm;

  shippingMethodId: string;
  billingSameAsShipping: boolean;
  billingAddress: AddressForm;

  paymentMethod: PaymentMethod;
  acceptedTerms: boolean;
}

export const EMPTY_ADDRESS: AddressForm = {
  // El pais viene fijado: la tienda solo envia dentro del Peru.
  country: "Peru",
  state: "",
  city: "",
  district: "",
  street: "",
  apartment: "",
};

const INITIAL_FORM: CheckoutForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  idType: "DNI",
  idNumber: "",
  needsInvoice: false,
  businessName: "",
  ruc: "",
  shippingAddress: { ...EMPTY_ADDRESS },
  shippingMethodId: "",
  billingSameAsShipping: true,
  billingAddress: { ...EMPTY_ADDRESS },
  paymentMethod: "YAPE_PLIN",
  acceptedTerms: false,
};

/**
 * El formulario a medias vive en sessionStorage y no en localStorage: son
 * datos personales que no tienen por que sobrevivir al cierre del navegador,
 * pero si deben aguantar una recarga accidental o el boton de atras entre
 * pasos.
 */
const checkoutStore = createPersistedStore<CheckoutForm>({
  key: STORAGE_KEY,
  initial: INITIAL_FORM,
  storage: () => window.sessionStorage,
  parse: (raw) => {
    if (typeof raw !== "object" || raw === null) return null;
    const parsed = raw as Partial<CheckoutForm>;
    // Se fusiona sobre los valores iniciales para que un formato guardado por
    // una version anterior no deje campos sin definir.
    return {
      ...INITIAL_FORM,
      ...parsed,
      shippingAddress: { ...EMPTY_ADDRESS, ...parsed.shippingAddress },
      billingAddress: { ...EMPTY_ADDRESS, ...parsed.billingAddress },
    };
  },
});

interface CheckoutContextValue {
  form: CheckoutForm;
  isReady: boolean;
  update: (patch: Partial<CheckoutForm>) => void;
  updateShippingAddress: (patch: Partial<AddressForm>) => void;
  updateBillingAddress: (patch: Partial<AddressForm>) => void;
  reset: () => void;
  /** El paso 1 esta completo y se puede avanzar al 2. */
  hasDetails: boolean;
  /** El paso 2 esta completo y se puede avanzar al 3. */
  hasDelivery: boolean;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

/** Estado del formulario de compra, compartido por los tres pasos. */
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const form = useSyncExternalStore(
    checkoutStore.subscribe,
    checkoutStore.getSnapshot,
    checkoutStore.getServerSnapshot,
  );

  const isReady = useSyncExternalStore(
    checkoutStore.subscribe,
    () => true,
    () => false,
  );

  const update = useCallback((patch: Partial<CheckoutForm>) => {
    checkoutStore.set({ ...checkoutStore.getSnapshot(), ...patch });
  }, []);

  const updateShippingAddress = useCallback((patch: Partial<AddressForm>) => {
    const current = checkoutStore.getSnapshot();
    checkoutStore.set({ ...current, shippingAddress: { ...current.shippingAddress, ...patch } });
  }, []);

  const updateBillingAddress = useCallback((patch: Partial<AddressForm>) => {
    const current = checkoutStore.getSnapshot();
    checkoutStore.set({ ...current, billingAddress: { ...current.billingAddress, ...patch } });
  }, []);

  const reset = useCallback(() => checkoutStore.clear(), []);

  const value = useMemo<CheckoutContextValue>(() => {
    const address = form.shippingAddress;
    const hasDetails =
      form.customerName.trim().length > 1 &&
      form.customerEmail.includes("@") &&
      form.customerPhone.trim().length > 6 &&
      form.idNumber.trim().length > 5 &&
      address.state.trim() !== "" &&
      address.city.trim() !== "" &&
      address.district.trim() !== "" &&
      address.street.trim() !== "" &&
      (!form.needsInvoice ||
        (form.businessName.trim().length > 2 && form.ruc.trim().length === 11));

    const billing = form.billingAddress;
    const hasDelivery =
      hasDetails &&
      form.shippingMethodId !== "" &&
      (form.billingSameAsShipping ||
        (billing.state.trim() !== "" &&
          billing.city.trim() !== "" &&
          billing.district.trim() !== "" &&
          billing.street.trim() !== ""));

    return {
      form,
      isReady,
      update,
      updateShippingAddress,
      updateBillingAddress,
      reset,
      hasDetails,
      hasDelivery,
    };
  }, [form, isReady, update, updateShippingAddress, updateBillingAddress, reset]);

  return <CheckoutContext value={value}>{children}</CheckoutContext>;
}

export function useCheckout(): CheckoutContextValue {
  const context = useContext(CheckoutContext);
  if (context === null) {
    throw new Error("useCheckout debe usarse dentro de CheckoutProvider.");
  }
  return context;
}

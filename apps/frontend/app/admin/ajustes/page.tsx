"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  adminGet,
  adminPatch,
  adminUpload,
  AdminApiError,
} from "@/lib/admin/client";
import { Field, inputClass } from "@/components/ui/field";
import { CheckIcon, PlusIcon, TrashIcon, UploadIcon } from "@/components/icons";
import type { BankAccount, MediaAsset, StoreSettings } from "@/lib/admin/types";

/**
 * Datos de pago y de la empresa.
 *
 * Es la pantalla que reemplaza a las variables de entorno COMPANY_* de las
 * fases anteriores: numero de Yape, cuentas bancarias, plazo de pago y, sobre
 * todo, el codigo QR, que ahora se sube como archivo en lugar de apuntar a
 * una imagen fija del repositorio.
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyRuc, setCompanyRuc] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [yapePhone, setYapePhone] = useState("");
  const [paymentWindowHours, setPaymentWindowHours] = useState("2");
  const [bankAccounts, setBankAccounts] = useState<Omit<BankAccount, "id">[]>([]);
  const [yapeQrUrl, setYapeQrUrl] = useState<string | null>(null);
  const [pendingAssetId, setPendingAssetId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminGet<StoreSettings>("/admin/settings")
      .then((data) => {
        setSettings(data);
        setCompanyName(data.companyName);
        setCompanyRuc(data.companyRuc);
        setCompanyEmail(data.companyEmail);
        setWhatsapp(data.whatsapp);
        setYapePhone(data.yapePhone);
        setPaymentWindowHours(String(data.paymentWindowHours));
        setBankAccounts(data.bankAccounts.map(({ bank, accountNumber, cci }) => ({ bank, accountNumber, cci })));
        setYapeQrUrl(data.yapeQrUrl);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No se pudo cargar."));
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const asset = await adminUpload<MediaAsset>("/admin/media", file);
      setPendingAssetId(asset.id);
      // Vista previa inmediata, antes incluso de guardar el formulario: el QR
      // subido se ve en el acto, pero no queda asignado hasta pulsar Guardar.
      setYapeQrUrl(asset.url);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "No se pudo subir la imagen.");
    } finally {
      setIsUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const updated = await adminPatch<StoreSettings>("/admin/settings", {
        companyName,
        companyRuc,
        companyEmail,
        whatsapp,
        yapePhone,
        paymentWindowHours: Number(paymentWindowHours) || 2,
        bankAccounts,
        ...(pendingAssetId ? { yapeQrAssetId: pendingAssetId } : {}),
      });
      setSettings(updated);
      setYapeQrUrl(updated.yapeQrUrl);
      setPendingAssetId(null);
      setSavedAt(Date.now());
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  if (error && !settings) {
    return <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p>;
  }
  if (!settings) {
    return <div className="h-96 animate-pulse border border-line bg-mist" aria-label="Cargando ajustes" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Ajustes de pago</h1>
      <p className="max-w-lg text-sm text-muted">
        Estos datos aparecen en el checkout y en el correo de pago pendiente que recibe cada cliente.
      </p>

      {error ? <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p> : null}
      {savedAt ? (
        <p className="flex items-center gap-2 text-sm text-accent" role="status">
          <CheckIcon className="size-4" />
          Ajustes guardados.
        </p>
      ) : null}

      <form onSubmit={submit} className="flex max-w-2xl flex-col gap-8">
        <section className="flex flex-col gap-6 border border-line bg-paper p-6">
          <h2 className="label-caps text-ash">Empresa</h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Razon social" htmlFor="companyName" required>
              <input
                id="companyName"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
            <Field label="RUC" htmlFor="companyRuc" required>
              <input
                id="companyRuc"
                value={companyRuc}
                onChange={(event) => setCompanyRuc(event.target.value)}
                required
                maxLength={11}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Correo de contacto" htmlFor="companyEmail" required>
              <input
                id="companyEmail"
                type="email"
                value={companyEmail}
                onChange={(event) => setCompanyEmail(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
            <Field
              label="WhatsApp"
              htmlFor="whatsapp"
              required
              hint="Formato internacional, sin espacios: 51946146622."
            >
              <input
                id="whatsapp"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="Plazo de pago (horas)"
            htmlFor="paymentWindowHours"
            required
            hint="Tiempo que tiene el cliente para pagar antes de que la orden se considere vencida."
          >
            <input
              id="paymentWindowHours"
              type="number"
              min={1}
              max={168}
              value={paymentWindowHours}
              onChange={(event) => setPaymentWindowHours(event.target.value)}
              required
              className={`${inputClass} max-w-32`}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-6 border border-line bg-paper p-6">
          <h2 className="label-caps text-ash">Yape / Plin</h2>

          <Field label="Numero" htmlFor="yapePhone" required>
            <input
              id="yapePhone"
              value={yapePhone}
              onChange={(event) => setYapePhone(event.target.value)}
              required
              className={`${inputClass} max-w-52`}
            />
          </Field>

          <div>
            <p className="text-sm font-medium">Codigo QR</p>
            <p className="mt-1 text-xs text-muted">
              Se muestra en la pagina de confirmacion y en el correo de pago pendiente.
            </p>

            <div className="mt-4 flex flex-wrap items-start gap-5">
              <div className="grid size-40 shrink-0 place-items-center border border-line bg-mist">
                {yapeQrUrl ? (
                  <Image src={yapeQrUrl} alt="Codigo QR de Yape" width={160} height={160} unoptimized />
                ) : (
                  <span className="px-4 text-center text-xs text-muted">Sin QR cargado</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                  id="yape-qr-file"
                />
                <label
                  htmlFor="yape-qr-file"
                  className="label-caps inline-flex h-11 cursor-pointer items-center gap-2 border border-line px-4 transition-colors hover:border-ink"
                >
                  <UploadIcon className="size-4" />
                  {isUploading ? "Subiendo..." : "Subir nuevo QR"}
                </label>

                {pendingAssetId ? (
                  <p className="text-xs text-accent">Nuevo QR listo. Pulsa &quot;Guardar ajustes&quot; para aplicarlo.</p>
                ) : null}

                <p className="text-xs text-muted">JPG, PNG, WEBP o SVG. Maximo 5 MB.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 border border-line bg-paper p-6">
          <h2 className="label-caps text-ash">Cuentas bancarias</h2>

          {bankAccounts.map((account, index) => (
            <div key={index} className="flex flex-wrap gap-2">
              <input
                value={account.bank}
                onChange={(event) =>
                  setBankAccounts((current) =>
                    current.map((item, i) => (i === index ? { ...item, bank: event.target.value } : item)),
                  )
                }
                placeholder="Banco"
                className={`${inputClass} w-32`}
              />
              <input
                value={account.accountNumber}
                onChange={(event) =>
                  setBankAccounts((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, accountNumber: event.target.value } : item,
                    ),
                  )
                }
                placeholder="Numero de cuenta"
                className={`${inputClass} flex-1`}
              />
              <input
                value={account.cci}
                onChange={(event) =>
                  setBankAccounts((current) =>
                    current.map((item, i) => (i === index ? { ...item, cci: event.target.value } : item)),
                  )
                }
                placeholder="CCI"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => setBankAccounts((current) => current.filter((_, i) => i !== index))}
                aria-label="Quitar cuenta"
                className="grid size-11 shrink-0 cursor-pointer place-items-center border border-line text-muted hover:text-danger"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setBankAccounts((current) => [...current, { bank: "", accountNumber: "", cci: "" }])}
            className="label-caps inline-flex w-fit cursor-pointer items-center gap-2 text-muted hover:text-ink"
          >
            <PlusIcon className="size-3.5" />
            Anadir cuenta
          </button>
        </section>

        <button
          type="submit"
          disabled={isSaving}
          className="label-caps inline-flex h-12 w-fit cursor-pointer items-center bg-accent px-8 text-paper transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "Guardando..." : "Guardar ajustes"}
        </button>
      </form>
    </div>
  );
}

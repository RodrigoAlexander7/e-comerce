"use client";

import { useMemo } from "react";
import { Field, inputClass, selectClass } from "@/components/ui/field";
import type { AddressForm } from "@/lib/checkout/checkout-context";
import type { Department } from "@/lib/api/types";

/**
 * Bloque de direccion con selectores encadenados.
 *
 * Elegir departamento reduce las provincias, y elegir provincia reduce los
 * distritos. Cuando una provincia todavia no tiene distritos cargados en el
 * catalogo del backend, el selector se sustituye por un campo de texto: es
 * preferible aceptar un distrito escrito a mano que impedir la compra.
 */
export function AddressFields({
  idPrefix,
  address,
  departments,
  errors,
  onChange,
}: {
  idPrefix: string;
  address: AddressForm;
  departments: Department[];
  errors: Partial<Record<keyof AddressForm, string>>;
  onChange: (patch: Partial<AddressForm>) => void;
}) {
  const provinces = useMemo(
    () => departments.find((item) => item.name === address.state)?.provinces ?? [],
    [departments, address.state],
  );

  const districts = useMemo(
    () => provinces.find((item) => item.name === address.city)?.districts ?? [],
    [provinces, address.city],
  );

  const hasDistrictList = address.city !== "" && districts.length > 0;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Pais" htmlFor={`${idPrefix}-country`} required>
          {/* La tienda solo envia dentro del Peru, asi que el campo se muestra
              relleno y bloqueado en lugar de ofrecer una lista de un elemento. */}
          <input
            id={`${idPrefix}-country`}
            className={inputClass}
            value={address.country}
            readOnly
            aria-readonly="true"
          />
        </Field>

        <Field
          label="Estado/Provincia"
          htmlFor={`${idPrefix}-state`}
          required
          error={errors.state}
        >
          <select
            id={`${idPrefix}-state`}
            className={selectClass}
            value={address.state}
            aria-invalid={errors.state ? true : undefined}
            onChange={(event) =>
              // Cambiar de departamento invalida provincia y distrito: dejarlos
              // guardaria una direccion imposible como Arequipa / Miraflores de Lima.
              onChange({ state: event.target.value, city: "", district: "" })
            }
          >
            <option value="">Selecciona un departamento</option>
            {departments.map((department) => (
              <option key={department.name} value={department.name}>
                {department.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Ciudad" htmlFor={`${idPrefix}-city`} required error={errors.city}>
          <select
            id={`${idPrefix}-city`}
            className={selectClass}
            value={address.city}
            disabled={address.state === ""}
            aria-invalid={errors.city ? true : undefined}
            onChange={(event) => onChange({ city: event.target.value, district: "" })}
          >
            <option value="">
              {address.state === "" ? "Elige antes el departamento" : "Selecciona una provincia"}
            </option>
            {provinces.map((province) => (
              <option key={province.name} value={province.name}>
                {province.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Distrito"
          htmlFor={`${idPrefix}-district`}
          required
          error={errors.district}
          hint={
            address.city !== "" && !hasDistrictList
              ? "Escribe el nombre del distrito."
              : undefined
          }
        >
          {hasDistrictList ? (
            <select
              id={`${idPrefix}-district`}
              className={selectClass}
              value={address.district}
              aria-invalid={errors.district ? true : undefined}
              onChange={(event) => onChange({ district: event.target.value })}
            >
              <option value="">Selecciona un distrito</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`${idPrefix}-district`}
              className={inputClass}
              value={address.district}
              disabled={address.city === ""}
              placeholder={address.city === "" ? "Elige antes la provincia" : ""}
              aria-invalid={errors.district ? true : undefined}
              onChange={(event) => onChange({ district: event.target.value })}
            />
          )}
        </Field>
      </div>

      <Field
        label="Calle y numero"
        htmlFor={`${idPrefix}-street`}
        required
        error={errors.street}
      >
        <input
          id={`${idPrefix}-street`}
          className={inputClass}
          value={address.street}
          autoComplete="street-address"
          aria-invalid={errors.street ? true : undefined}
          onChange={(event) => onChange({ street: event.target.value })}
        />
      </Field>

      <Field label="Departamento, suite, etc." htmlFor={`${idPrefix}-apartment`}>
        <input
          id={`${idPrefix}-apartment`}
          className={inputClass}
          value={address.apartment}
          autoComplete="address-line2"
          onChange={(event) => onChange({ apartment: event.target.value })}
        />
      </Field>
    </>
  );
}

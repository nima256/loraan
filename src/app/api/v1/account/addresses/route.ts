import { z } from "zod";
import { handler, created, ok, readJson } from "@/server/lib/http";
import { requireCustomer } from "@/server/lib/session";
import { createAddress, listAddresses } from "@/server/services/customers";
import { optionalText, phoneSchema, postalCodeSchema, text } from "@/server/lib/validation";

/** GET / POST /api/v1/account/addresses */

export const addressSchema = z.object({
  title: text(1, 40, "عنوان آدرس را وارد کنید."),
  recipientFirstName: text(2, 60, "نام گیرنده را وارد کنید."),
  recipientLastName: text(2, 60, "نام خانوادگی گیرنده را وارد کنید."),
  phone: phoneSchema,
  province: text(2, 60, "استان را انتخاب کنید."),
  city: text(2, 60, "شهر را انتخاب کنید."),
  addressLine: text(10, 300, "نشانی کامل پستی را وارد کنید."),
  postalCode: postalCodeSchema,
  plaque: optionalText(10),
  unit: optionalText(10),
  isDefault: z.boolean().optional(),
});

export const GET = handler(async () => {
  const customer = await requireCustomer();
  return ok({ addresses: await listAddresses(customer.id) });
});

export const POST = handler(async (request) => {
  const customer = await requireCustomer();
  const input = await readJson(request, addressSchema);
  const address = await createAddress(customer.id, input);
  return created({ address, addresses: await listAddresses(customer.id) });
});

import axios from "axios";
import { env } from "../config/env.js";

export async function sendWhatsApp(telefone: string, mensagem: string): Promise<void> {
  const { EVOLUTION_API_URL, EVOLUTION_NAME, EVOLUTION_KEY } = env;
  if (!EVOLUTION_API_URL || !EVOLUTION_NAME || !EVOLUTION_KEY) {
    console.log("[WHATSAPP DEV] To: " + telefone + " | " + mensagem);
    return;
  }
  const number = telefone.replace(/\D/g, "");
  const fullNumber = number.startsWith("55") ? number : "55" + number;
  await axios.post(
    EVOLUTION_API_URL + "/message/sendText/" + EVOLUTION_NAME,
    { number: fullNumber, text: mensagem },
    { headers: { apikey: EVOLUTION_KEY } },
  );
}

export function buildPasswordResetWhatsApp(resetUrl: string, fullName: string): string {
  const firstName = fullName.split(" ")[0];
  return "Ola, " + firstName + "!\n\nRecebemos uma solicitacao de redefinicao de senha.\n\nLink: " + resetUrl + "\n\nEste link expira em 1 hora.";
}

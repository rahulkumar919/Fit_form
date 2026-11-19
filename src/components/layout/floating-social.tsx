"use client";
import { usePathname } from "next/navigation";
import { InstagramIcon } from "@/components/icons/instagram";
import { cn } from "@/lib/utils";

/** Floating WhatsApp + Instagram buttons. Switched on in Admin → Homepage → Social & buttons. */
export function FloatingSocial({
  whatsapp, whatsappMessage, instagramHandle, storeName, aboveBottomNav = false,
}: { whatsapp: string; whatsappMessage: string; instagramHandle: string; storeName: string; aboveBottomNav?: boolean }) {
  const pathname = usePathname();
  const digits = whatsapp.replace(/\D/g, "");
  const showWa = digits.length >= 10;
  if ((!showWa && !instagramHandle) || pathname.startsWith("/checkout")) return null;
  const text = encodeURIComponent(whatsappMessage || `Hi ${storeName}, I have a question.`);
  // Product and combo pages have a sticky buy bar on phones; sit above it.
  const raised = pathname.startsWith("/product/") || pathname.startsWith("/combo/");
  const btn = "grid size-12 place-items-center rounded-full text-white shadow-lg shadow-black/20 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  return (
    <div className={cn("fixed right-4 z-40 flex flex-col gap-2.5 sm:right-6", raised ? "bottom-24 md:bottom-6" : aboveBottomNav ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6" : "bottom-5 sm:bottom-6")}>
      {instagramHandle && (
        <a href={`https://www.instagram.com/${instagramHandle}/`} target="_blank" rel="noopener noreferrer"
          aria-label={`Follow @${instagramHandle} on Instagram (opens in a new tab)`}
          className={cn(btn, "bg-[radial-gradient(circle_at_30%_110%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285AEB_90%)] focus-visible:ring-[#d6249f]")}>
          <InstagramIcon className="size-6" />
        </a>
      )}
      {showWa && (
        <a href={`https://wa.me/${digits}?text=${text}`} target="_blank" rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp (opens in a new tab)" className={cn(btn, "bg-[#25D366] hover:bg-[#1ebe5b] focus-visible:ring-[#25D366]")}>
          <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      )}
    </div>
  );
}

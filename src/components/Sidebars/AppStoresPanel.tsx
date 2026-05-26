import {Icon} from "@iconify/react";
import {PanelChrome} from "./PanelChrome";

export function AppStoresPanel() {
  return (
    <PanelChrome title="Мобильное приложение">
      <div className="space-y-6 p-6 text-center">
        <p className="text-sm text-muted">
          Сканируй QR-код или перейди в App Store / Google Play
        </p>

        <div className="mx-auto grid size-48 place-items-center rounded-2xl bg-white p-4">
          <Icon icon="gravity-ui:qr-code" className="size-full text-black" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a className="flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-sm transition-colors hover:bg-surface-secondary">
            <Icon icon="gravity-ui:logo-apple" className="size-5" />
            App Store
          </a>
          <a className="flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-sm transition-colors hover:bg-surface-secondary">
            <Icon icon="gravity-ui:logo-google" className="size-5" />
            Google Play
          </a>
        </div>

        <p className="text-[10px] text-muted">
          Web-версия уже работает как PWA — нажми «Установить» в адресной строке.
        </p>
      </div>
    </PanelChrome>
  );
}

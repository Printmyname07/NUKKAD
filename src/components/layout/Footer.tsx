import { NukkadLogo } from '../ui/NukkadLogo.tsx';
import { Store, ShieldCheck, MapPin, Heart } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext.tsx';

interface FooterProps {
  onOpenSetupGuide: () => void;
  onNavigate?: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSetupGuide, onNavigate }) => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onNavigate?.('landing')}
              className="flex items-center gap-2.5 text-white font-bold text-base text-left group cursor-pointer"
            >
              <NukkadLogo size={32} />
              <span className="text-white font-black text-lg tracking-tight">NUKKAD</span>
            </button>
            <p className="text-slate-400 leading-relaxed">
              {t.footer.taglineDescription}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-medium text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-[#08A85A]" />
              <span>{t.landing.launchCityBadge}</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">{t.footer.aboutSectionTitle}</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('landing')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left"
                >
                  {t.navigation.home}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('customer')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left"
                >
                  {t.footer.customerDiscoveryLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('register')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left"
                >
                  {t.footer.vendorRegisterLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('login')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left"
                >
                  {t.navigation.login}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">{t.footer.trustSectionTitle}</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t.footer.singleShopIntegrity}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t.footer.separatedStates}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t.footer.dualVerificationFlow}</span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSetupGuide}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors text-left font-medium"
                >
                  {t.footer.viewArchitectureSpecs} &rarr;
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">{t.footer.prototypeNoticeTitle}</h4>
            <p className="text-slate-400 leading-relaxed mb-3">
              {t.footer.prototypeNoticeBody}
            </p>
            <p className="text-[11px] text-slate-500">
              {t.footer.prototypeNoticeDisclaimer}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div>
            &copy; 2026 {t.footer.copyrightNotice}
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>English / हिन्दी</span>
            <span>•</span>
            <span>{t.footer.jaipurMvpBadge}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

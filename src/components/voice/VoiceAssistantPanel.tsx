import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Send,
  Loader2,
  HelpCircle,
  ArrowRight,
  Package,
  History,
  Store,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  getSpeechRecognition,
  isSpeechRecognitionSupported,
  VoiceLanguage,
} from '../../services/voice/voiceAssistantService.ts';

export interface ProposedAction {
  id: string;
  actionType: 'add_product' | 'update_stock' | 'change_price' | 'pause_shop' | 'resume_shop' | 'mark_order_ready';
  title: string;
  summary: string;
  details: {
    productName?: string;
    productId?: string;
    oldValue?: string;
    newValue?: string;
    unit?: string;
    price?: number;
    quantity?: number;
    orderId?: string;
    orderNumber?: string;
  };
}

export interface AssistantFeedback {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  spokenMessage?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  transcript: string;
  status: 'executed' | 'cancelled' | 'query' | 'error';
  summary: string;
}

interface Props {
  onClose: () => void;
  onProcessCommand: (transcript: string) => void;
  onConfirmExecution: (proposal: ProposedAction) => void;
  onCancelProposal: () => void;
  proposal: ProposedAction | null;
  feedback: AssistantFeedback | null;
  onSelectOption?: (value: string) => void;
  isExecuting: boolean;
  activities: ActivityItem[];
  currentLanguage: VoiceLanguage;
  onChangeLanguage: (lang: VoiceLanguage) => void;
}

export const VoiceAssistantPanel: React.FC<Props> = ({
  onClose,
  onProcessCommand,
  onConfirmExecution,
  onCancelProposal,
  proposal,
  feedback,
  onSelectOption,
  isExecuting,
  activities,
  currentLanguage,
  onChangeLanguage,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const supported = isSpeechRecognitionSupported();

  useEffect(() => {
    if (!supported) return;

    try {
      const recognition = getSpeechRecognition();
      if (recognition) {
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = currentLanguage;

        recognition.onstart = () => {
          setIsListening(true);
          setMicError(null);
        };

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setLiveTranscript(current);

          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
            const finalTranscript = current.trim();
            if (finalTranscript) {
              onProcessCommand(finalTranscript);
            }
            setIsListening(false);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('[VoiceAssistant] Speech recognition event error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setMicError(
              currentLanguage === 'hi-IN'
                ? 'माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया ब्राउज़र सेटिंग में अनुमति दें या नीचे टाइप करें।'
                : 'Microphone permission was denied. Please allow microphone access or use manual input below.'
            );
          } else if (event.error === 'no-speech') {
            setMicError(
              currentLanguage === 'hi-IN'
                ? 'कोई आवाज़ सुनाई नहीं दी। कृपया पुनः बोलें।'
                : 'No speech was detected. Please tap the mic and try speaking again.'
            );
          } else if (event.error !== 'aborted') {
            setMicError(
              currentLanguage === 'hi-IN'
                ? 'ध्वनि पहचान त्रुटि। कृपया पुनः प्रयास करें या नीचे टाइप करें।'
                : `Speech recognition error (${event.error}). Please try again or type below.`
            );
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.warn('[VoiceAssistant] Error initializing SpeechRecognition:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [currentLanguage, onProcessCommand, supported]);

  const toggleListening = () => {
    setMicError(null);
    if (!supported) {
      setMicError(
        currentLanguage === 'hi-IN'
          ? 'इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया नीचे लिखकर कमांड दें।'
          : 'Speech recognition is not supported in this browser. Please type your command below.'
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      setLiveTranscript('');
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = currentLanguage;
          recognitionRef.current.start();
        }
      } catch (err) {
        console.warn('[VoiceAssistant] Start error:', err);
        setIsListening(false);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const commandText = manualInput.trim();
    setLiveTranscript(commandText);
    setManualInput('');
    onProcessCommand(commandText);
  };

  const suggestedCommandsEn = [
    'Check low stock',
    'Show my new orders',
    'Add tomatoes at 40 rupees per kilo with 20 kilos in stock',
    'Change tomato stock to 10 kilos',
    'Change the price of apples to 120 rupees per kilo',
    'Pause my shop',
    'Resume my shop',
  ];

  const suggestedCommandsHi = [
    'कम स्टॉक चेक करो',
    'लंबित ऑर्डर दिखाओ',
    'टमाटर का स्टॉक 10 किलो करो',
    'सेब का दाम 120 रुपये प्रति किलो करो',
    'टमाटर जोड़ो 40 रुपये प्रति किलो 20 किलो स्टॉक',
    'दुकान बंद करो',
    'दुकान खोलो',
  ];

  const suggestedCommands = currentLanguage === 'hi-IN' ? suggestedCommandsHi : suggestedCommandsEn;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-assistant-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#064E46] via-[#08675c] to-[#08A85A] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voice-assistant-title" className="text-base sm:text-lg font-extrabold tracking-tight">
                  NUKKAD Voice Assistant
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-300/30">
                  Vendor Copilot
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                {currentLanguage === 'hi-IN'
                  ? 'अपनी आवाज़ से स्टॉक, दाम, ऑर्डर और दुकान प्रबंधित करें'
                  : 'Manage stock, prices, orders, and shop availability by voice'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => onChangeLanguage('en-US')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentLanguage === 'en-US'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('hi-IN')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentLanguage === 'hi-IN'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Voice Assistant"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-900 text-xs">
          {/* Browser Unsupported Notice */}
          {!supported && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Browser Speech API Notice:</span>{' '}
                {currentLanguage === 'hi-IN'
                  ? 'आपके ब्राउज़र में आवाज़ पहचान सीधे समर्थित नहीं है। आप नीचे दिए गए बॉक्स में अपनी कमांड टाइप कर सकते हैं।'
                  : 'Browser-native speech recognition is not supported in this browser. You can type commands in the manual input below or use Google Chrome/Microsoft Edge.'}
              </div>
            </div>
          )}

          {/* Microphone Permission / Recognition Error */}
          {micError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{micError}</div>
              <button
                onClick={() => setMicError(null)}
                className="text-rose-600 hover:text-rose-800 cursor-pointer text-[11px] font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Central Interactive Microphone Button */}
          {!proposal && (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="relative flex items-center justify-center">
                {isListening && (
                  <>
                    <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
                    <div className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-rose-500/10 animate-pulse pointer-events-none" />
                  </>
                )}
                <button
                  type="button"
                  onClick={toggleListening}
                  aria-label={isListening ? 'Stop listening' : 'Start voice recognition'}
                  className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white shadow-rose-600/30 hover:bg-rose-700 scale-105'
                      : 'bg-[#08A85A] text-white shadow-[#08A85A]/30 hover:bg-[#079550] hover:scale-105'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-8 h-8 sm:w-9 sm:h-9 animate-bounce" />
                      <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-8 h-8 sm:w-9 sm:h-9" />
                      <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Tap to Speak</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold text-slate-500">
                  {isListening
                    ? currentLanguage === 'hi-IN'
                      ? 'सुन रहे हैं... कृपया स्पष्ट बोलें'
                      : 'Listening... speak your command clearly'
                    : currentLanguage === 'hi-IN'
                    ? 'माइक दबाएं और बोलें, या नीचे कमांड टाइप करें'
                    : 'Tap the mic to give a command, or type below'}
                </p>
                {liveTranscript && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs italic max-w-md mx-auto">
                    "{liveTranscript}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Structured Confirmation Proposal Card */}
          {proposal && (
            <div className="p-5 rounded-3xl bg-emerald-50/50 border-2 border-[#08A85A]/40 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    {proposal.actionType.replace('_', ' ')}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900">{proposal.title}</h3>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Confirmation Required
                </span>
              </div>

              <div className="space-y-2 text-slate-700">
                <p className="font-semibold text-xs text-slate-900">{proposal.summary}</p>

                {/* Exact Before & After Values Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-white rounded-2xl border border-emerald-100 text-xs">
                  {proposal.details.productName && (
                    <div className="col-span-2 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Catalog Item:</span>
                      <span className="font-extrabold text-slate-900">{proposal.details.productName}</span>
                    </div>
                  )}

                  {proposal.details.orderNumber && (
                    <div className="col-span-2 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Order Number:</span>
                      <span className="font-extrabold text-slate-900">#{proposal.details.orderNumber}</span>
                    </div>
                  )}

                  {proposal.details.oldValue !== undefined && (
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Current Value:</span>
                      <div className="font-bold text-slate-700">{proposal.details.oldValue}</div>
                    </div>
                  )}

                  {proposal.details.newValue !== undefined && (
                    <div className="space-y-0.5">
                      <span className="text-emerald-600 font-medium text-[11px]">Proposed Change:</span>
                      <div className="font-extrabold text-[#08A85A]">{proposal.details.newValue}</div>
                    </div>
                  )}

                  {proposal.details.price !== undefined && proposal.actionType === 'add_product' && (
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Price:</span>
                      <div className="font-extrabold text-slate-900">
                        ₹{proposal.details.price} / {proposal.details.unit || 'piece'}
                      </div>
                    </div>
                  )}

                  {proposal.details.quantity !== undefined && proposal.actionType === 'add_product' && (
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Initial Stock:</span>
                      <div className="font-extrabold text-slate-900">
                        {proposal.details.quantity} {proposal.details.unit || 'piece'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm / Cancel Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onConfirmExecution(proposal)}
                  disabled={isExecuting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#08A85A] hover:bg-[#079550] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Marketplace...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Execute</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onCancelProposal}
                  disabled={isExecuting}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Assistant Feedback / Response Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : feedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : feedback.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : feedback.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <div className="font-bold">{feedback.message}</div>

                {/* Multiple Product Candidates / Clarification Options */}
                {feedback.options && feedback.options.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold opacity-90 block">
                      Select the intended product:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {feedback.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => onSelectOption && onSelectOption(opt.value)}
                          className="px-3 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-bold text-[11px] border border-slate-200 shadow-sm cursor-pointer"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Command Input Fallback Form */}
          <form onSubmit={handleManualSubmit} className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Manual Text Input Fallback</span>
              <span className="text-[10px] text-slate-400 font-normal">Works when microphone is muted</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={
                  currentLanguage === 'hi-IN'
                    ? 'कमांड लिखें (उदा. "चावल का स्टॉक 15 करो" या "टमाटर जोड़ो 40 प्रति किलो 20 किलो स्टॉक")'
                    : 'Type a command (e.g. "Set rice stock to 15" or "Add tomatoes at 40 per kg with 20 kg stock")'
                }
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                aria-label="Submit command"
                className="absolute right-2 p-1.5 rounded-lg bg-[#08A85A] hover:bg-[#079550] text-white disabled:opacity-40 disabled:hover:bg-[#08A85A] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Suggested Voice Commands */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#08A85A]" />
              <span>
                {currentLanguage === 'hi-IN' ? 'सुझाए गए वॉयस कमांड' : 'Suggested Voice Commands'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedCommands.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => {
                    setLiveTranscript(cmd);
                    onProcessCommand(cmd);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200/60 text-slate-600 text-[11px] font-medium transition-all cursor-pointer text-left"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>

          {/* Recent Voice Activity History */}
          {activities.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Recent Voice Operations</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {activities.slice(0, 4).map((act) => (
                  <div
                    key={act.id}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="font-bold text-slate-800 truncate">{act.summary}</div>
                      <div className="text-[10px] text-slate-400 truncate">"{act.transcript}"</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        act.status === 'executed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.status === 'cancelled'
                          ? 'bg-slate-200 text-slate-700'
                          : act.status === 'error'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

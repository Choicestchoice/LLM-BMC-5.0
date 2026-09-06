import { useEffect, useRef, useState } from "react";
import {
  BMC_BLOCKS,
  BMC_LABELS,
  BMC_GUIDANCE,
  type Bmc,
  type BmcBlockKey,
} from "@/lib/artefact";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

/* -------------------- Read-only display (unchanged) -------------------- */

export function BMCCanvas({ bmc }: { bmc: Bmc }) {
  return (
    <div className="grid gap-px bg-border rounded-xl overflow-hidden border border-border md:grid-cols-10 md:grid-rows-3 text-sm">
      <DisplayBlock className="md:col-span-2 md:row-span-2" k="keyPartners" bmc={bmc} />
      <div className="md:col-span-2 md:row-span-2 grid grid-rows-2 gap-px bg-border">
        <DisplayBlock k="keyActivities" bmc={bmc} />
        <DisplayBlock k="keyResources" bmc={bmc} />
      </div>
      <DisplayBlock className="md:col-span-2 md:row-span-2" k="valuePropositions" bmc={bmc} accent />
      <div className="md:col-span-2 md:row-span-2 grid grid-rows-2 gap-px bg-border">
        <DisplayBlock k="customerRelationships" bmc={bmc} />
        <DisplayBlock k="channels" bmc={bmc} />
      </div>
      <DisplayBlock className="md:col-span-2 md:row-span-2" k="customerSegments" bmc={bmc} />
      <DisplayBlock className="md:col-span-5" k="costStructure" bmc={bmc} />
      <DisplayBlock className="md:col-span-5" k="revenueStreams" bmc={bmc} />
    </div>
  );
}

function DisplayBlock({
  k,
  bmc,
  className,
  accent,
}: {
  k: BmcBlockKey;
  bmc: Bmc;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={`bg-card p-4 ${accent ? "bg-primary/[0.04]" : ""} ${className ?? ""}`}>
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        {BMC_LABELS[k]}
      </div>
      <ul className="space-y-1.5">
        {bmc[k].map((item, i) => (
          <li key={i} className="text-foreground/90 leading-snug">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------- Editor as question list -------------------- */

const BMC_QUESTIONS: Record<BmcBlockKey, string> = {
  keyPartners:
    "Who are the key partners, suppliers, or alliances that help your business operate?",
  keyActivities:
    "What are the most important activities your business must perform to deliver value?",
  keyResources:
    "What key resources — people, assets, IP, or capital — does your business rely on?",
  valuePropositions:
    "What unique value do you deliver to your customers, and what problems do you solve for them?",
  customerRelationships:
    "What type of relationship do you build and maintain with each customer group?",
  channels:
    "Through which channels do you reach, sell to, and deliver value to your customers?",
  customerSegments:
    "Who are the specific customers or groups your business serves?",
  costStructure:
    "What are the most important costs involved in running your business?",
  revenueStreams:
    "How does your business generate revenue, and what pricing model do you use?",
};

export function BMCEditor({
  bmc,
  setBmc,
  onSuggestBlock,
  suggesting,
}: {
  bmc: Bmc;
  setBmc: React.Dispatch<React.SetStateAction<Bmc>>;
  onSuggestBlock: (block: BmcBlockKey) => Promise<string[]>;
  suggesting: BmcBlockKey | null;
}) {
  return (
    <ol className="space-y-6">
      {BMC_BLOCKS.map((k, i) => (
        <QuestionItem
          key={k}
          index={i + 1}
          k={k}
          value={bmc[k]}
          onChange={(items) => setBmc((b) => ({ ...b, [k]: items }))}
          onSuggest={() => onSuggestBlock(k)}
          loading={suggesting === k}
        />
      ))}
    </ol>
  );
}

function joinForTextarea(items: string[]) {
  return items.join("\n");
}
function splitFromTextarea(text: string) {
  return text
    .split("\n")
    .map((s) => s.replace(/^[•\-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function QuestionItem({
  index,
  k,
  value,
  onChange,
  onSuggest,
  loading,
}: {
  index: number;
  k: BmcBlockKey;
  value: string[];
  onChange: (items: string[]) => void;
  onSuggest: () => Promise<string[]>;
  loading: boolean;
}) {
  const guidance = BMC_GUIDANCE[k];
  const question = BMC_QUESTIONS[k];
  const [text, setText] = useState(joinForTextarea(value));
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const joined = joinForTextarea(value);
    if (joined !== text && document.activeElement !== ref.current) {
      setText(joined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <li className="border-b border-border pb-6 last:border-b-0">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xs font-medium text-muted-foreground tabular-nums mt-0.5">
            {String(index).padStart(2, "0")}
          </span>
          <label
            htmlFor={`bmc-${k}`}
            className="text-base leading-snug text-foreground font-medium"
          >
            {question}
          </label>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 h-8 px-3 text-xs"
          onClick={async () => {
            const items = await onSuggest();
            const merged = Array.from(new Set([...value, ...items]));
            onChange(merged);
            setText(joinForTextarea(merged));
          }}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Suggest with AI
            </>
          )}
        </Button>
      </div>
      <Textarea
        id={`bmc-${k}`}
        ref={ref}
        rows={4}
        value={text}
        placeholder={guidance.placeholder}
        onChange={(e) => {
          setText(e.target.value);
          onChange(splitFromTextarea(e.target.value));
        }}
        className="text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/60"
      />
    </li>
  );
}

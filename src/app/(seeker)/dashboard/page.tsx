"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface Card { id: string; job_title: string; city: string; is_active: boolean; }
interface Intro { id: string; employer_id: string; message: string; status: "pending" | "revealed" | "passed"; created_at: string; }

export default function Dashboard() {
  const supabase = createClient();
  const [card, setCard] = useState<Card | null>(null);
  const [intros, setIntros] = useState<Intro[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealOpen, setRevealOpen] = useState(false);
  const [selectedIntro, setSelectedIntro] = useState<Intro | null>(null);
  const [revealData, setRevealData] = useState({ name: false, email: false, phone: false, linkedin: false });

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: cardData } = await supabase
          .from("seeker_cards")
          .select("id, job_title, city, is_active")
          .eq("profile_id", user.id)
          .single();
        if (cardData) setCard(cardData);

        const { data: introsData } = await supabase
          .from("intros")
          .select("id, employer_id, message, status, created_at")
          .eq("seeker_id", user.id)
          .order("created_at", { ascending: false });
        if (introsData) setIntros(introsData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleToggle = async () => {
    if (!card) return;
    const { error } = await supabase.from("seeker_cards").update({ is_active: !card.is_active }).eq("id", card.id);
    if (!error) setCard({ ...card, is_active: !card.is_active });
  };

  const handlePass = async (id: string) => {
    const { error } = await supabase.from("intros").update({ status: "passed" }).eq("id", id);
    if (!error) setIntros(intros.map((i) => i.id === id ? { ...i, status: "passed" as const } : i));
  };

  const handleRevealClick = (intro: Intro) => {
    setSelectedIntro(intro);
    setRevealData({ name: false, email: false, phone: false, linkedin: false });
    setRevealOpen(true);
  };

  const handleReveal = async () => {
    if (!selectedIntro) return;
    const { error: re } = await supabase.from("reveals").insert({ intro_id: selectedIntro.id, show_name: revealData.name, show_email: revealData.email, show_phone: revealData.phone, show_linkedin: revealData.linkedin });
    if (!re) {
      const { error: ue } = await supabase.from("intros").update({ status: "revealed" }).eq("id", selectedIntro.id);
      if (!ue) { setIntros(intros.map((i) => i.id === selectedIntro.id ? { ...i, status: "revealed" as const } : i)); setRevealOpen(false); }
    }
  };

  if (loading) return <div className="screen-body flex items-center justify-center min-h-[60vh]"><p className="text-sm text-gray">Loading…</p></div>;

  const pending = intros.filter((i) => i.status === "pending");
  const revealed = intros.filter((i) => i.status === "revealed");
  const passed = intros.filter((i) => i.status === "passed");

  return (
    <div className="screen-body">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h2 className="text-2xl font-extrabold text-charcoal">Your Dashboard</h2>
        {card && <p className="text-sm text-gray mt-1">{card.job_title} in {card.city}</p>}
      </div>

      {/* Status Banner */}
      <Card className="mx-4 my-3 px-4 py-3 border-0 shadow-sm flex items-center gap-2.5">
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            card?.is_active
              ? "bg-green shadow-[0_0_0_3px_rgba(72,187,120,0.2)]"
              : "bg-gray-light"
          }`}
        />
        <div className="flex-1 text-xs text-gray leading-relaxed">
          {card?.is_active
            ? "You're live. Employers in your area can see your card."
            : "You're hidden. No one can see your card."}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          className="text-xs font-semibold whitespace-nowrap"
        >
          {card?.is_active ? "Go dark" : "Go live"}
        </Button>
      </Card>

      {/* Stats */}
      <div className="flex gap-3 px-4 py-3 my-3 mx-4 bg-white rounded-3xl shadow-sm">
        <div className="flex-1 text-center">
          <div className="text-2xl font-extrabold text-charcoal">{pending.length}</div>
          <div className="text-xs text-gray mt-1 font-medium">Interested</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-extrabold text-charcoal">{revealed.length}</div>
          <div className="text-xs text-gray mt-1 font-medium">Talking</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-extrabold text-charcoal">{passed.length}</div>
          <div className="text-xs text-gray mt-1 font-medium">Passed</div>
        </div>
      </div>

      {/* Pending Intros */}
      {pending.length > 0 && (
        <div className="px-4 space-y-3">
          <div className="text-sm font-bold text-charcoal px-2 py-3">They're interested ({pending.length})</div>
          {pending.map((intro) => (
            <Card key={intro.id} className="p-4 border-0 shadow-sm">
              <div className="text-xs text-gray-light mb-2">{timeAgo(new Date(intro.created_at))}</div>
              <div className="text-sm text-gray-dark italic mb-3 leading-relaxed">"{intro.message}"</div>
              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePass(intro.id)}
                  className="flex-1 text-xs font-semibold"
                >
                  Pass
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRevealClick(intro)}
                  className="flex-[2] bg-charcoal hover:bg-charcoal-light text-white text-xs font-semibold"
                >
                  Show them who I am
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Revealed */}
      {revealed.length > 0 && (
        <div className="px-4 space-y-2">
          <div className="text-sm font-bold text-charcoal px-2 py-3 mt-2">Talking ({revealed.length})</div>
          {revealed.map((intro) => (
            <div key={intro.id} className="flex justify-between items-center px-4 py-3.5 bg-white rounded-xl shadow-sm">
              <span className="text-xs font-medium text-charcoal">Connected</span>
              <Badge className="bg-charcoal text-white text-xs">REVEALED</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {intros.length === 0 && (
        <div className="text-center py-10 px-7">
          <div className="text-4xl mb-3 opacity-40">💬</div>
          <div className="text-base font-bold text-charcoal mb-1">All quiet for now</div>
          <div className="text-sm text-gray leading-relaxed">When someone reaches out, it shows up here.</div>
        </div>
      )}

      {/* Reveal Modal */}
      <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
        <DialogContent className="w-full max-w-[430px] rounded-t-3xl rounded-b-none">
          <DialogHeader>
            <DialogTitle>You're in control</DialogTitle>
          </DialogHeader>

          {selectedIntro && (
            <div className="space-y-4">
              <div className="bg-off-white p-4 rounded-2xl">
                <div className="font-semibold text-sm text-charcoal">Their message</div>
                <div className="text-xs text-gray mt-2 italic">"{selectedIntro.message}"</div>
              </div>

              <div className="text-xs font-bold text-charcoal">
                Only share what you're comfortable with
              </div>

              <div className="space-y-3">
                {(["name", "email", "phone", "linkedin"] as const).map((key) => (
                  <div key={key} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={revealData[key]}
                      onCheckedChange={() => setRevealData({ ...revealData, [key]: !revealData[key] })}
                    />
                    <span className="text-sm text-charcoal font-medium" onClick={() => setRevealData({ ...revealData, [key]: !revealData[key] })}>
                      {key === "name" ? "My real name" : key === "email" ? "Email address" : key === "phone" ? "Phone number" : "LinkedIn"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <div className="text-xs text-gray font-semibold mb-2">They'll see:</div>
                <div className="flex flex-wrap gap-2">
                  {revealData.name && <Badge className="bg-charcoal text-white text-xs">My real name</Badge>}
                  {revealData.email && <Badge className="bg-charcoal text-white text-xs">Email address</Badge>}
                  {revealData.phone && <Badge className="bg-charcoal text-white text-xs">Phone number</Badge>}
                  {revealData.linkedin && <Badge className="bg-charcoal text-white text-xs">LinkedIn</Badge>}
                  {!Object.values(revealData).some((v) => v) && (
                    <span className="text-xs text-gray">Nothing selected</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setRevealOpen(false)}
                  className="flex-1 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReveal}
                  className="flex-[2] bg-charcoal hover:bg-charcoal-light text-white text-sm"
                >
                  Let them in
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

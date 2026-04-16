"use client";

import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Link as LinkIcon, Loader, ExternalLink, Heart } from "lucide-react";
import Link from "next/link";

interface RevealedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  hired: boolean;
}

interface OutreachEntry {
  id: string;
  date: string;
  status: "pending" | "revealed" | "passed" | "hired";
  candidateName: string;
}

// Sample data for fallback
const SAMPLE_REVEALED_CONTACTS: RevealedContact[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    phone: "(319) 555-0142",
    linkedin: "linkedin.com/in/sarahchen",
    hired: false,
  },
  {
    id: "2",
    name: "Marcus Williams",
    email: "marcus.w@email.com",
    phone: "(515) 555-0167",
    linkedin: "linkedin.com/in/marcuswilliams",
    hired: false,
  },
];

const SAMPLE_OUTREACH: OutreachEntry[] = [
  {
    id: "1",
    date: "Mar 28, 2026",
    status: "pending",
    candidateName: "Jennifer Park",
  },
  {
    id: "2",
    date: "Mar 25, 2026",
    status: "revealed",
    candidateName: "David Rodriguez",
  },
  {
    id: "3",
    date: "Mar 20, 2026",
    status: "passed",
    candidateName: "Emily Thompson",
  },
  {
    id: "4",
    date: "Mar 15, 2026",
    status: "hired",
    candidateName: "James O'Brien",
  },
];

interface HireDialogState {
  open: boolean;
  contact: RevealedContact | null;
}

export default function ContactsPage() {
  const [supabase] = useState(() => createClient());
  const [userName, setUserName] = useState("Carter");
  const [companyName, setCompanyName] = useState("Express Employment");
  const [revealedContacts, setRevealedContacts] = useState<RevealedContact[]>(SAMPLE_REVEALED_CONTACTS);
  const [outreach, setOutreach] = useState<OutreachEntry[]>(SAMPLE_OUTREACH);
  const [hireDialog, setHireDialog] = useState<HireDialogState>({ open: false, contact: null });
  const [salary, setSalary] = useState("");
  const [hiringContact, setHiringContact] = useState(false);
  const [hireError, setHireError] = useState("");

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, company")
          .eq("id", session.session.user.id)
          .single();

        if (profile) {
          if (profile.name) setUserName(profile.name);
          if (profile.company) setCompanyName(profile.company);
        }
      }
    };

    loadProfile();
  }, []);

  const handleHireClick = (contact: RevealedContact) => {
    setHireDialog({ open: true, contact });
    setSalary("");
    setHireError("");
  };

  const handleConfirmHire = async () => {
    if (!hireDialog.contact || !salary.trim()) return;

    setHiringContact(true);
    setHireError("");

    try {
      // Update contact as hired
      const updatedContacts = revealedContacts.map((c) =>
        c.id === hireDialog.contact?.id ? { ...c, hired: true } : c
      );
      setRevealedContacts(updatedContacts);

      // Update the intro status in database
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user?.id) {
        const { error } = await supabase
          .from("intros")
          .update({ status: "hired" })
          .match({ employer_id: session.session.user.id, seeker_id: hireDialog.contact.id });

        if (error) {
          setHireError(error.message);
        }
      }

      setHireDialog({ open: false, contact: null });
      setSalary("");
    } catch (err) {
      setHireError("Failed to update hire status");
    } finally {
      setHiringContact(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case "pending":
      case "passed":
        return "secondary";
      case "revealed":
      case "hired":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-gray-light text-charcoal border-0";
      case "revealed":
        return "bg-charcoal text-white border-0";
      case "passed":
        return "bg-gray-light text-gray-dark border-0";
      case "hired":
        return "bg-charcoal text-white border-0";
      default:
        return "";
    }
  };

  const revealedCount = revealedContacts.length;
  const sentCount = outreach.length;
  const waitingCount = outreach.filter((o) => o.status === "pending").length;
  const openedCount = outreach.filter((o) => o.status === "revealed").length;
  const hiredCount = outreach.filter((o) => o.status === "hired").length;

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-charcoal mb-1">Hey, {userName}.</h1>
        <p className="text-sm text-gray">{companyName}</p>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-charcoal">{sentCount}</p>
              <p className="text-xs text-gray-muted">Sent</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-charcoal">{waitingCount}</p>
              <p className="text-xs text-gray-muted">Waiting</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-charcoal">{openedCount}</p>
              <p className="text-xs text-gray-muted">Opened</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-charcoal">{hiredCount}</p>
              <p className="text-xs text-gray-muted">Hired</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* People who shared with you section */}
      <div className="px-4 py-6 space-y-4">
        <h2 className="text-base font-semibold text-charcoal">
          People who shared with you ({revealedCount})
        </h2>

        {revealedCount === 0 ? (
          <Card className="bg-white border-border">
            <CardContent className="p-8 text-center">
              <p className="text-base font-semibold text-charcoal mb-2">
                Nobody's opened up yet
              </p>
              <p className="text-sm text-gray mb-4">
                When someone shares their info, they'll show up here.
              </p>
              <Link href="/browse">
                <Button className="bg-charcoal text-white hover:bg-charcoal-light">
                  Browse candidates
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {revealedContacts.map((contact) => (
              <Card key={contact.id} className="bg-white border-border overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3 items-start mb-3">
                    <Avatar className="h-10 w-10 bg-charcoal-light">
                      <AvatarFallback className="bg-charcoal-light text-white font-semibold text-sm">
                        {contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal">{contact.name}</p>
                      <div className="space-y-1 mt-2">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-2 text-xs text-gray hover:text-charcoal transition-colors"
                          >
                            <Mail size={14} />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-2 text-xs text-gray hover:text-charcoal transition-colors"
                          >
                            <Phone size={14} />
                            {contact.phone}
                          </a>
                        )}
                        {contact.linkedin && (
                          <a
                            href={`https://${contact.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-gray hover:text-charcoal transition-colors"
                          >
                            <LinkIcon size={14} />
                            LinkedIn
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                    {!contact.hired && (
                      <Dialog open={hireDialog.open && hireDialog.contact?.id === contact.id} onOpenChange={(open) => {
                        if (!open) {
                          setHireDialog({ open: false, contact: null });
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handleHireClick(contact)}
                            variant="ghost"
                            size="sm"
                            className="text-charcoal hover:bg-off-white"
                          >
                            <Heart size={16} />
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="w-full max-w-md">
                          <DialogHeader>
                            <DialogTitle>Hire {hireDialog.contact?.name}?</DialogTitle>
                            <DialogDescription>
                              Confirm you want to bring them on board.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-semibold text-charcoal block mb-2">
                                Salary offer
                              </label>
                              <Input
                                type="text"
                                placeholder="$50,000/year"
                                value={salary}
                                onChange={(e) => setSalary(e.target.value)}
                              />
                            </div>

                            {hireError && (
                              <div className="bg-red-bg border border-red text-red text-xs p-3 rounded-lg">
                                {hireError}
                              </div>
                            )}
                          </div>

                          <DialogFooter className="flex gap-2 mt-6">
                            <DialogClose asChild>
                              <Button variant="outline" className="flex-1 border-border">
                                Cancel
                              </Button>
                            </DialogClose>
                            <Button
                              onClick={handleConfirmHire}
                              disabled={hiringContact || !salary.trim()}
                              className="flex-1 bg-charcoal text-white hover:bg-charcoal-light disabled:opacity-50"
                            >
                              {hiringContact ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                "Hire"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    {contact.hired && (
                      <Badge className="bg-charcoal text-white border-0">Hired</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Your outreach section */}
      <div className="px-4 py-6 border-t border-border">
        <h2 className="text-base font-semibold text-charcoal mb-4">
          Your outreach ({sentCount})
        </h2>

        {outreach.length === 0 ? (
          <Card className="bg-white border-border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray">No outreach yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {outreach.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-white border border-border rounded-lg">
                <div>
                  <p className="font-medium text-charcoal text-sm">{entry.candidateName}</p>
                  <p className="text-xs text-gray-muted">{entry.date}</p>
                </div>
                <Badge className={getStatusBadgeClass(entry.status)}>
                  {entry.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

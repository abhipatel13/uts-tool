"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/types";
import { BulkUserService, BulkUserSubmissionResult, BulkUserSubmissionItem, } from "@/services";
import { getCurrentUser } from "@/utils/auth"

type DraftUser = {
  name?: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  companyId?: number;
};

const ROLE_OPTIONS = [
  { value: "superuser", label: "Superuser" },
  { value: "admin", label: "Admin" },
  { value: "supervisor", label: "Supervisor" },
  { value: "user", label: "User" },
];
const VALID_ROLE_VALUES = new Set(ROLE_OPTIONS.map(r => r.value));

export default function BulkUploadUsersPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
  const [drafts, setDrafts] = useState<DraftUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<BulkUserSubmissionResult | null>(null);
  const [createdList, setCreatedList] = useState<BulkUserSubmissionItem[]>([]);
  const [updatedList, setUpdatedList] = useState<BulkUserSubmissionItem[]>([]);
  const [existingList, setExistingList] = useState<BulkUserSubmissionItem[]>([]);
  const [rowErrors, setRowErrors] = useState<string[][]>([]);

  // Mapping state
  const [pendingCsvText, setPendingCsvText] = useState<string | null>(null);
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [headerColumns, setHeaderColumns] = useState<string[]>([]);
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({});

  // Load companies on mount
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        setSelectedCompanyId(user?.company_id || user?.company?.id);
        // const response = await UniversalUserApi.getAllCompanies();
        // if (response.status) {
        //   const raw = (response.data || []) as Array<{ id: number; name: string }>;
        //   const list = raw.map((c) => ({ id: c.id, name: c.name }));
        //   setCompanies(list);
        // }
      } catch {
        // non-blocking
      }
    })();
  }, []);

  const extractHeader = (text: string): string[] => {
    const firstLine = text.split(/\r?\n/)[0] || "";
    const headers: string[] = [];
    let cur = ""; let inQ = false;
    for (let i = 0; i < firstLine.length; i++) {
      const ch = firstLine[i];
      if (inQ) {
        if (ch === '"') { if (firstLine[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; } }
        else { cur += ch; }
      } else {
        if (ch === '"') inQ = true; else if (ch === ',') { headers.push(cur); cur = ""; } else { cur += ch; }
      }
    }
    headers.push(cur);
    return headers.map(h => h.trim());
  };

  const onFileSelected = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const headers = extractHeader(text);
      setHeaderColumns(headers);
      const normalized = headers.map(h => h.toLowerCase());
      const guess = (aliases: string[]) => {
        const idx = normalized.findIndex(h => aliases.includes(h));
        return idx >= 0 ? headers[idx] : "";
      };
      setHeaderMap({
        name: guess(["name", "full name", "fullname"]),
        email: guess(["email", "e-mail", "mail"]),
        role: guess(["role", "user role", "type"]),
        department: guess(["department", "dept"]),
        phone: guess(["phone", "phone number", "phonenumber", "mobile", "cell"]),
      });
      setPendingCsvText(text);
      setIsMappingOpen(true);
      setResults(null);
      toast({ title: "Map columns", description: "Please map your CSV columns before parsing." });
    } catch (e) {
      toast({ title: "Read error", description: e instanceof Error ? e.message : "Failed to read CSV", variant: "destructive" });
    }
  }, [toast]);

  const parseWithMapping = useCallback((text: string, map: Record<string, string>): DraftUser[] => {
    const lines = text.split(/\r?\n/);
    const headerLine = lines.shift() || "";
    const headers = extractHeader(headerLine);
    const indexOf = (name?: string) => {
      if (!name || name === "__none__") return -1;
      return headers.findIndex(h => h === name);
    };
    const idxName = indexOf(map.name);
    const idxEmail = indexOf(map.email);
    const idxRole = indexOf(map.role);
    const idxDept = indexOf(map.department);
    const idxPhone = indexOf(map.phone);

    // Tokenize remaining rows
    const rebuilt = [headerLine, ...lines].join("\n");
    const rows: string[][] = [];
    let current = ""; let row: string[] = []; let inQuotes = false;
    const pushCell = () => { row.push(current); current = ""; };
    const pushRow = () => { rows.push(row); row = []; };
    for (let i = 0; i < rebuilt.length; i++) {
      const char = rebuilt[i];
      if (inQuotes) {
        if (char === '"') { if (rebuilt[i + 1] === '"') { current += '"'; i++; } else { inQuotes = false; } }
        else { current += char; }
      } else {
        if (char === '"') inQuotes = true; else if (char === ',') pushCell(); else if (char === "\n") { pushCell(); pushRow(); } else if (char !== "\r") current += char;
      }
    }
    pushCell(); if (row.length) pushRow();
    if (rows.length <= 1) return [];
    const out: DraftUser[] = [];
    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r];
      if (!cols || cols.every(c => (c || "").trim() === "")) continue;
      const rawRole = (idxRole >= 0 ? (cols[idxRole] || "").trim().toLowerCase() : "user") || "user";
      const normalizedRole = VALID_ROLE_VALUES.has(rawRole) ? rawRole : "user";
      out.push({
        name: idxName >= 0 ? (cols[idxName] || "").trim() : undefined,
        email: idxEmail >= 0 ? (cols[idxEmail] || "").trim() : "",
        role: normalizedRole,
        department: idxDept >= 0 ? (cols[idxDept] || "").trim() : undefined,
        phone: idxPhone >= 0 ? (cols[idxPhone] || "").trim() : undefined,
      });
    }
    return out;
  }, []);

  const finalizeMappingAndParse = useCallback(() => {
    if (!pendingCsvText) return;
    const parsed = parseWithMapping(pendingCsvText, headerMap);
    const withCompany = selectedCompanyId ? parsed.map(d => ({ ...d, companyId: selectedCompanyId })) : parsed;
    setDrafts(withCompany);
    setRowErrors([]);
    setIsMappingOpen(false);
    setPendingCsvText(null);
    toast({ title: "CSV parsed", description: `Loaded ${withCompany.length} rows.` });
  }, [pendingCsvText, headerMap, selectedCompanyId, toast, parseWithMapping]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const updateDraft = useCallback((index: number, patch: Partial<DraftUser>) => {
    setDrafts(prev => prev.map((d, i) => i === index ? { ...d, ...patch } : d));
    setRowErrors(prev => {
      const copy = prev.slice();
      if (copy[index] && copy[index].length) copy[index] = [];
      return copy;
    });
  }, []);

  const removeDraft = useCallback((index: number) => {
    setDrafts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const resetAll = useCallback(() => {
    setDrafts([]);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const isValid = useMemo(() => {
    return drafts.length > 0 && selectedCompanyId !== undefined && drafts.every(d => d.email && d.role);
  }, [drafts, selectedCompanyId]);

  const submit = useCallback(async () => {
    if (!isValid) {
      toast({ title: "Invalid data", description: "Ensure all rows have email, role, and a company is selected.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<User>[] = drafts.map(d => ({
        email: d.email,
        name: d.name,
        role: d.role,
        department: d.department,
        phone: d.phone,
        company_id: selectedCompanyId ?? d.companyId,
      }));
      const res = await BulkUserService.bulkUpsertUsers(payload, { batchSize: 50 });
      setResults(res);
      setCreatedList(res.created || []);
      setUpdatedList(res.updated || []);
      setExistingList(res.existing || []);

      // Rebuild drafts to contain only failed rows, preserving order by original indices
      const byIndex = (res.failed || []).filter(f => typeof f.index === 'number').sort((a,b) => (a.index as number) - (b.index as number));
      const unresolved = (res.failed || []).filter(f => typeof f.index !== 'number');
      const failedDrafts: DraftUser[] = [];
      const failedErrors: string[][] = [];
      byIndex.forEach(f => {
        const i = f.index as number;
        if (drafts[i]) {
          failedDrafts.push(drafts[i]);
          failedErrors.push(f.errors || ["Unknown error"]);
        }
      });
      // Fallback matching by email if index missing
      unresolved.forEach(f => {
        const pos = drafts.findIndex(d => d.email.toLowerCase() === (f.email || '').toLowerCase());
        if (pos >= 0) {
          failedDrafts.push(drafts[pos]);
          failedErrors.push(f.errors || ["Unknown error"]);
        }
      });
      setDrafts(failedDrafts);
      setRowErrors(failedErrors);

      const summary = `Created ${res.created.length}, Updated ${res.updated.length}, Existing ${res.existing.length}, Failed ${res.failed.length}`;
      toast({ title: "Bulk user result", description: summary });
    } catch (e) {
      toast({ title: "Submission error", description: e instanceof Error ? e.message : "Failed to submit users", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [drafts, isValid, toast, selectedCompanyId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Users</h1>
        </div>

        <Card className="border-0 shadow">
          <CardHeader>
            <CardTitle>Upload CSV and Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1">
                  <Label>Upload CSV</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onFileSelected(f);
                      }}
                    />
                    <Button type="button" onClick={handleUploadClick} variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose CSV
                    </Button>
                    {drafts.length > 0 && (
                      <Button type="button" onClick={resetAll} variant="ghost">Clear</Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Expected columns: email, name, role, department, phone</p>
                </div>

                {/* <div className="w-full md:w-80">
                  <Label className="block">Company for upload</Label>
                  <Select value={selectedCompanyId !== undefined ? String(selectedCompanyId) : undefined} onValueChange={(v) => {
                    const id = v ? Number(v) : undefined;
                    setSelectedCompanyId(id);
                    if (id !== undefined) {
                      setDrafts(prev => prev.map(d => ({ ...d, companyId: id })));
                    }
                  }}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">All users will be assigned to this company.</p>
                </div> */}
              </div>

              {/* Status Summary (separate row to avoid shifting controls) */}
              <div className="border rounded-md bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="mr-2">Status:</Label>
                  <Badge variant="outline">Rows: {drafts.length}</Badge>
                  {results && (
                    <>
                      <Badge variant="secondary">Created {results.created.length}</Badge>
                      <Badge variant="secondary">Updated {results.updated.length}</Badge>
                      <Badge variant="secondary">Existing {results.existing.length}</Badge>
                      {results.failed && results.failed.length > 0 && (
                        <Badge variant="destructive">Failed {results.failed.length}</Badge>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Result Summary (created/updated/existing) */}
              {results && (createdList.length + updatedList.length + existingList.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">Created ({createdList.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-sm text-gray-700 max-h-40 overflow-auto">
                        {createdList.map((c, i) => (
                          <div key={`c-${i}`}>{c.email}</div>
                        ))}
                        {createdList.length === 0 && <div className="text-gray-400">None</div>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">Updated ({updatedList.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-sm text-gray-700 max-h-40 overflow-auto">
                        {updatedList.map((u, i) => (
                          <div key={`u-${i}`}>{u.email}</div>
                        ))}
                        {updatedList.length === 0 && <div className="text-gray-400">None</div>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">Existing ({existingList.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-sm text-gray-700 max-h-40 overflow-auto">
                        {existingList.map((x, i) => (
                          <div key={`x-${i}`}>{x.email}</div>
                        ))}
                        {existingList.length === 0 && <div className="text-gray-400">None</div>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="border rounded-md overflow-x-auto">
                <div className="min-w-[900px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Name</TableHead>
                        <TableHead className="whitespace-nowrap">Email</TableHead>
                        <TableHead className="whitespace-nowrap">Role</TableHead>
                        <TableHead className="whitespace-nowrap">Department</TableHead>
                        <TableHead className="whitespace-nowrap">Phone</TableHead>
                        <TableHead className="whitespace-nowrap w-[80px] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drafts.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Input className="w-full min-w-[260px]" value={d.name || ""} onChange={(e) => updateDraft(i, { name: e.target.value })} placeholder="Name" />
                            {rowErrors[i] && rowErrors[i].length > 0 && (
                              <div className="text-xs text-red-600 mt-1">{rowErrors[i].join(', ')}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input className="w-full min-w-[300px]" value={d.email} onChange={(e) => updateDraft(i, { email: e.target.value })} placeholder="Email" />
                          </TableCell>
                          <TableCell>
                            <Select value={d.role} onValueChange={(v) => updateDraft(i, { role: v })}>
                              <SelectTrigger className="w-full min-w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map(r => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input className="w-full min-w-[220px]" value={d.department || ""} onChange={(e) => updateDraft(i, { department: e.target.value })} placeholder="Department" />
                          </TableCell>
                          <TableCell>
                            <Input className="w-full min-w-[160px]" value={d.phone || ""} onChange={(e) => updateDraft(i, { phone: e.target.value })} placeholder="Phone" />
                          </TableCell>
                          <TableCell className="w-[80px] text-center">
                            <div className="flex gap-2 min-w-[80px] justify-center">
                              <Button variant="outline" size="sm" onClick={() => removeDraft(i)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {drafts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500">No rows loaded. Upload a CSV to begin.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <div className="flex gap-2">
                  <Link href="/universal-portal">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                </div>
                <Button onClick={submit} disabled={!isValid || submitting}>
                  {submitting ? "Submitting..." : "Submit Users"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mapping Dialog */}
        <Dialog open={isMappingOpen} onOpenChange={setIsMappingOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Map CSV Columns</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Name (optional)' },
                { key: 'email', label: 'Email (required)' },
                { key: 'role', label: 'Role (required)' },
                { key: 'department', label: 'Department (optional)' },
                { key: 'phone', label: 'Phone (optional)' },
              ].map((f) => (
                <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <Label className="sm:min-w-48">{f.label}</Label>
                  <Select value={headerMap[f.key] || undefined} onValueChange={(v) => setHeaderMap(prev => ({ ...prev, [f.key]: v }))}>
                    <SelectTrigger className="w-full sm:w-80">
                      <SelectValue placeholder="Select a CSV column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {headerColumns.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="text-xs text-gray-500">
                Email and Role are required. Unknown roles default to User.
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsMappingOpen(false)}>Cancel</Button>
                <Button onClick={finalizeMappingAndParse}>Continue</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}



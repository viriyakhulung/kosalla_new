import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("kosalla_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${API_BASE}/portal/tickets?per_page=20`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => null);
  return NextResponse.json(json, { status: res.status });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("kosalla_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const form = await req.formData();

  // Map field FE -> BE
  const fd = new FormData();
  fd.set("subject", String(form.get("subject") ?? ""));
  fd.set("description_html", String(form.get("description_html") ?? ""));

  const category = String(form.get("category") ?? "");
  const productType = String(form.get("product_type") ?? "");
  if (category) fd.set("category", category);
  else if (productType) fd.set("category", productType);

  const tagging = String(form.get("tagging_word") ?? "");
  if (tagging) fd.set("tagging_word", tagging);

  // requested date (FE bisa pakai requested_resolution_date atau requested_date)
  const reqDate =
    String(form.get("requested_resolution_date") ?? "") ||
    String(form.get("requested_date") ?? "");
  if (reqDate) fd.set("requested_resolution_date", reqDate);

  const priorityMap: Record<string, string> = {
    Low: "low",
    Normal: "normal",
    High: "high",
    Urgent: "high", // backend hanya low|normal|high
  };
  const priority = priorityMap[String(form.get("priority") ?? "Normal")] || "normal";
  fd.set("priority", priority);

  const inventoryItemId = form.get("inventory_item_id");
  if (inventoryItemId) fd.set("inventory_item_id", String(inventoryItemId));

  // expected date (PS)
  const expectedDate = String(form.get("expected_date") ?? "");
  if (expectedDate) fd.set("expected_date", expectedDate);

  // complete_ps (radio yes/no)
  const completePs = String(form.get("complete_ps") ?? "");
  if (completePs === "1" || completePs === "true" || completePs === "yes") {
    fd.set("complete_ps", "1");
  } else if (completePs === "0" || completePs === "false" || completePs === "no") {
    fd.set("complete_ps", "0");
  }

  // schedule comment
  const scheduleComment = String(form.get("schedule_comment") ?? "");
  if (scheduleComment) fd.set("schedule_comment", scheduleComment);

  // optional fields tambahan
  const version = String(form.get("version") ?? "");
  if (version) fd.set("version", version);
  const buildNo = String(form.get("build_no") ?? "");
  if (buildNo) fd.set("build_no", buildNo);
  const patchNo = String(form.get("patch_no") ?? "");
  if (patchNo) fd.set("patch_no", patchNo);
  const moduleName = String(form.get("module") ?? "");
  if (moduleName) fd.set("module", moduleName);
  const errorCode = String(form.get("error_code") ?? "");
  if (errorCode) fd.set("error_code", errorCode);

  const project = String(form.get("project") ?? "");
  if (project) fd.set("project", project);
  const customer = String(form.get("customer") ?? "");
  if (customer) fd.set("customer", customer);
  const severity = String(form.get("severity") ?? "");
  if (severity) fd.set("severity", severity);

  // Create ticket
  const ticketRes = await fetch(`${API_BASE}/portal/tickets`, {
    method: "POST",
    body: fd,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const ticketJson = await ticketRes.json().catch(() => null);
  if (!ticketRes.ok) {
    return NextResponse.json(ticketJson ?? { message: "Create failed" }, { status: ticketRes.status });
  }

  const ticketId = ticketJson?.data?.id || ticketJson?.id;
  const files = form.getAll("attachments[]") as File[];
  if (!files.length) {
    return NextResponse.json(ticketJson, { status: 201 });
  }

  // Upload attachments ke backend (field: files[])
  const uploadFd = new FormData();
  files.forEach((f) => uploadFd.append("files[]", f));

  const uploadRes = await fetch(`${API_BASE}/tickets/${ticketId}/attachments`, {
    method: "POST",
    body: uploadFd,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const uploadJson = await uploadRes.json().catch(() => null);
  if (!uploadRes.ok) {
    return NextResponse.json(uploadJson ?? { message: "Upload failed" }, { status: uploadRes.status });
  }

  return NextResponse.json({ ...ticketJson, attachments: uploadJson?.attachments }, { status: 201 });
}

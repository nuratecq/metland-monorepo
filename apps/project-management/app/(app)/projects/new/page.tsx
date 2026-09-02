import { ProjectForm } from "@/components/forms/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>New Project</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">Fields: project_code auto-generated PRJ-XXXX</p>
      <ProjectForm />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  FileText,
  X,
  Plus,
  Check,
  Globe,
  Code,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { GDEntryTypeConfig, GDTemplate } from "@/types/generalDiary";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

interface GDTemplateModalProps {
  types: GDEntryTypeConfig[];
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: GDTemplate, typeConfig: GDEntryTypeConfig) => void;
  onSaveCustomTemplate?: (template: GDTemplate) => Promise<void>;
}

export function GDTemplateModal({
  types,
  isOpen,
  onClose,
  onSelectTemplate,
  onSaveCustomTemplate,
}: GDTemplateModalProps) {
  const [selectedType, setSelectedType] = useState<string>(types[0]?.code || "DEPARTURE");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);

  // New Custom Template Form State
  const [newTitle, setNewTitle] = useState("");
  const [newTitleHi, setNewTitleHi] = useState("");
  const [newLang, setNewLang] = useState<"hi" | "en" | "mixed">("hi");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");

  if (!isOpen) return null;

  const currentTypeConfig = types.find((t) => t.code === selectedType) || types[0];
  const templates = currentTypeConfig?.defaultTemplates || [];

  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim() || !onSaveCustomTemplate) return;

    const customTmpl: GDTemplate = {
      id: `tmpl_custom_${Date.now()}`,
      typeCode: selectedType,
      title: newTitle,
      titleHi: newTitleHi || newTitle,
      language: newLang,
      subjectTemplate: newSubject || "बाबत {{subject}}",
      bodyTemplate: newBody,
      variables: [],
      isUserSaved: true,
    };

    await onSaveCustomTemplate(customTmpl);
    setShowNewTemplateForm(false);
    setNewTitle("");
    setNewTitleHi("");
    setNewSubject("");
    setNewBody("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Official Roznamcha GD Templates Library
              </h3>
              <p className="text-[11px] text-slate-300">
                PPR 22.48 Standard Legal Wording • Hindi, English &amp; Mixed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: GD Types List */}
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/60 p-3 overflow-y-auto space-y-1.5 max-h-[70vh]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 pb-1">
              GD Entry Types ({types.length})
            </p>
            {types.map((type) => {
              const isSelected = type.code === selectedType;
              return (
                <button
                  key={type.code}
                  type="button"
                  onClick={() => {
                    setSelectedType(type.code);
                    setShowNewTemplateForm(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0b192c] text-white shadow-xs font-semibold"
                      : "hover:bg-slate-200/60 text-slate-800"
                  }`}
                >
                  <p className="text-xs leading-tight font-bold">{type.nameHi}</p>
                  <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    {type.nameEn}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Templates for Selected Type */}
          <div className="md:col-span-8 p-4 sm:p-5 overflow-y-auto max-h-[70vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  {currentTypeConfig?.nameHi}
                </h4>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  {currentTypeConfig?.description}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewTemplateForm(!showNewTemplateForm)}
                className="text-xs font-bold gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showNewTemplateForm ? "View Templates" : "Add Custom"}</span>
              </Button>
            </div>

            {showNewTemplateForm ? (
              /* Custom Template Creator Form */
              <form onSubmit={handleSaveCustom} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h5 className="font-bold text-xs text-slate-900">Create Station Custom Template</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-semibold text-slate-700">Template Title (English) *</label>
                      <VoiceInputButton
                        onTranscript={(text) => setNewTitle(text)}
                        fieldLabel="Template Title"
                        iconOnly={true}
                      />
                    </div>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Night Domination Beat 2"
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-semibold text-slate-700">शीर्षक (हिंदी)</label>
                      <VoiceInputButton
                        onTranscript={(text) => setNewTitleHi(text)}
                        fieldLabel="शीर्षक हिंदी"
                        preferredLang="hi-IN"
                        iconOnly={true}
                      />
                    </div>
                    <input
                      type="text"
                      value={newTitleHi}
                      onChange={(e) => setNewTitleHi(e.target.value)}
                      placeholder="e.g. रात्रि नाकाबंदी बीट 2"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">विषय प्रारूप (Subject Template)</label>
                    <VoiceInputButton
                      onTranscript={(text) => setNewSubject(text)}
                      fieldLabel="विषय प्रारूप"
                      preferredLang="hi-IN"
                      iconOnly={true}
                    />
                  </div>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. रवानगी मुलाज़मान बराए गश्त बीट {{beatName}}"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">विवरण प्रारूप (Body Text Template) *</label>
                    <VoiceInputButton
                      onTranscript={(text) => setNewBody((prev) => (prev ? `${prev} ${text}` : text))}
                      fieldLabel="विवरण प्रारूप"
                      preferredLang="hi-IN"
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Use {{variableName}} for dynamic fields like {{officerName}}, {{vehicleNo}}..."
                    required
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowNewTemplateForm(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-[#0b192c] text-white text-xs font-bold">
                    Save Template
                  </Button>
                </div>
              </form>
            ) : (
              /* Templates List */
              <div className="space-y-3">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 hover:border-blue-400 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{tmpl.title}</span>
                        {tmpl.isDefault && (
                          <span className="text-[9px] font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded">
                            Standard PPR
                          </span>
                        )}
                        {tmpl.isUserSaved && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                            Station Custom
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          onSelectTemplate(tmpl, currentTypeConfig);
                          onClose();
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Use This Template</span>
                      </Button>
                    </div>

                    <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-150">
                      <span className="font-bold text-slate-800">विषय: </span>
                      {tmpl.subjectTemplate}
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-3 bg-slate-50/50 p-2.5 rounded border border-slate-100 italic leading-relaxed">
                      &ldquo;{tmpl.bodyTemplate}&rdquo;
                    </p>

                    {tmpl.variables.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold">Variables:</span>
                        {tmpl.variables.map((v) => (
                          <span
                            key={v.key}
                            className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded"
                          >
                            &#123;&#123;{v.key}&#125;&#125;
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

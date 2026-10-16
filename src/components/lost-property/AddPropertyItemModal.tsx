"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Upload, FileText, Check } from "lucide-react";
import {
  LostPropertyItem,
  PROPERTY_CATEGORIES,
  ELECTRICAL_ITEM_NAMES,
} from "@/types/lostProperty";

interface AddPropertyItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: LostPropertyItem) => void;
  initialData?: LostPropertyItem | null;
}

export const AddPropertyItemModal: React.FC<AddPropertyItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [category, setCategory] = useState<string>(
    initialData?.category || "ELECTRICAL AND ELECTRONIC GOODS"
  );
  const [subType, setSubType] = useState<string>(
    initialData?.subType || "MOBILE PHONE"
  );
  const [estimatedValue, setEstimatedValue] = useState<number | string>(
    initialData?.estimatedValue ?? 12000
  );
  const [idType, setIdType] = useState<LostPropertyItem["idType"]>(
    initialData?.idType || "IMEI NO."
  );
  const [identNumberInput, setIdentNumberInput] = useState<string>("");
  const [identificationNumbers, setIdentificationNumbers] = useState<string[]>(
    initialData?.identificationNumbers && initialData.identificationNumbers.length > 0
      ? initialData.identificationNumbers
      : ["864920048192031"]
  );
  const [quantity, setQuantity] = useState<number>(initialData?.quantity || 1);
  const [makeManufacturer, setMakeManufacturer] = useState<string>(
    initialData?.makeManufacturer || "Samsung"
  );
  const [remarks, setRemarks] = useState<string>(
    initialData?.remarks || "Samsung Galaxy Smartphone Black colour with Jio SIM inserted."
  );
  const [uploadedDocs, setUploadedDocs] = useState<string[]>(
    initialData?.documents || ["Invoice_Samsung_Store.pdf"]
  );

  if (!isOpen) return null;

  const handleAddIdNumber = () => {
    if (identNumberInput.trim()) {
      if (!identificationNumbers.includes(identNumberInput.trim())) {
        setIdentificationNumbers([...identificationNumbers, identNumberInput.trim()]);
      }
      setIdentNumberInput("");
    }
  };

  const handleRemoveIdNumber = (index: number) => {
    setIdentificationNumbers(identificationNumbers.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setCategory("Select");
    setSubType("");
    setEstimatedValue("");
    setIdType("");
    setIdentNumberInput("");
    setIdentificationNumbers([]);
    setQuantity(1);
    setMakeManufacturer("");
    setRemarks("");
  };

  const handleSaveOrAdd = () => {
    if (!category || category === "Select") {
      alert("Please select Property Category *");
      return;
    }
    if (!subType.trim()) {
      alert("Please select or enter Item Name *");
      return;
    }
    if (!makeManufacturer.trim()) {
      alert("Please enter Make (Manufacturer) *");
      return;
    }

    const newItem: LostPropertyItem = {
      id: initialData?.id || `prop_${Date.now()}`,
      category,
      subType,
      estimatedValue: Number(estimatedValue) || 0,
      idType,
      identificationNumbers,
      quantity: Number(quantity) || 1,
      makeManufacturer,
      remarks,
      documents: uploadedDocs,
    };

    onSave(newItem);
    onClose();
  };

  const handleFakeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      setUploadedDocs([...uploadedDocs, fileName]);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-amber-400">
              Add New Property Details (खोई संपत्ति विवरण)
            </h3>
            <p className="text-[11px] text-slate-300">
              Haryana Police CCTNS Lost Property Sub-Record
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-slate-800">
          {/* 1. Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Property Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            >
              {PROPERTY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Item Name & Estimated Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              {category === "ELECTRICAL AND ELECTRONIC GOODS" ? (
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium max-h-40"
                >
                  <option value="">Select Item Name</option>
                  {ELECTRICAL_ITEM_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Wallet, Documents, Gold Chain"
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Value (Lost / Stolen / Involved) (in INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 12000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          {/* 3. ID Type & Identification No. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                ID Type
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Select</option>
                <option value="IMEI NO.">IMEI NO.</option>
                <option value="ISDN/SIM NO.">ISDN/SIM NO.</option>
                <option value="MAC NO.">MAC NO.</option>
                <option value="OTHERS">OTHERS</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Identification No.
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 864920048192031"
                  value={identNumberInput}
                  onChange={(e) => setIdentNumberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddIdNumber();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddIdNumber}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Listed Identification Numbers */}
          {identificationNumbers.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Added Identification / IMEI Numbers:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {identificationNumbers.map((num, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-mono"
                  >
                    {idType || "ID"}: <strong>{num}</strong>
                    <button
                      type="button"
                      onClick={() => handleRemoveIdNumber(idx)}
                      className="text-slate-400 hover:text-red-600 ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4. Quantity & Make (Manufacturer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Make (Manufacturer) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Samsung / Apple / Dell"
                value={makeManufacturer}
                onChange={(e) => setMakeManufacturer(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Remarks / Specific Identification Marks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Colour, scratch marks, cover, IMEI label, etc."
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
            />
          </div>

          {/* 5. Upload Document(s) */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Upload Document(s) (Invoice / Bill / Photo)
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Choose File</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFakeFileUpload}
                />
              </label>
            </div>
            {uploadedDocs.length > 0 ? (
              <div className="space-y-1">
                {uploadedDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-slate-200"
                  >
                    <span className="font-mono text-slate-700">{doc}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedDocs(uploadedDocs.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No document uploaded yet</p>
            )}
          </div>
        </div>

        {/* Footer Buttons: Add, Save, Clear, Close */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-white text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-white text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveOrAdd}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save &amp; Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

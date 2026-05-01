'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Tenant {
  id: string;
  slug: string;
  businessName: string;
  ownerName: string;
  bio: string | null;
  defaultCurrency: 'CUP' | 'MLC' | 'USD';
  loyaltyEvery: number;
  loyaltyDiscount: number;
  ratesCupPerUsd: number | null;
  ratesMlcPerUsd: number | null;
}

export default function AjustesPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Tenant>('/tenant').then(setTenant).catch(() => {});
  }, []);

  if (!tenant) return <p className="text-rose-700">Cargando...</p>;

  function update<K extends keyof Tenant>(k: K, v: Tenant[K]) {
    setTenant({ ...tenant!, [k]: v });
  }

  async function save() {
    if (!tenant) return;
    setSaving(true);
    const updated = await api<Tenant>('/tenant', {
      method: 'PATCH',
      json: {
        businessName: tenant.businessName,
        ownerName: tenant.ownerName,
        bio: tenant.bio ?? '',
        defaultCurrency: tenant.defaultCurrency,
        loyaltyEvery: tenant.loyaltyEvery,
        loyaltyDiscount: tenant.loyaltyDiscount,
        ratesCupPerUsd: tenant.ratesCupPerUsd ?? undefined,
        ratesMlcPerUsd: tenant.ratesMlcPerUsd ?? undefined,
      },
    });
    setTenant(updated);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-rose-700">Ajustes del negocio</h1>

      <div className="card grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nombre del negocio</label>
          <input
            className="input"
            value={tenant.businessName}
            onChange={(e) => update('businessName', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tu nombre</label>
          <input
            className="input"
            value={tenant.ownerName}
            onChange={(e) => update('ownerName', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Bio (visible en tu pagina publica)</label>
          <textarea
            className="input min-h-[80px]"
            value={tenant.bio ?? ''}
            onChange={(e) => update('bio', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Moneda por defecto</label>
          <select
            className="input"
            value={tenant.defaultCurrency}
            onChange={(e) => update('defaultCurrency', e.target.value as any)}
          >
            <option value="CUP">CUP</option>
            <option value="MLC">MLC</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className="label">Slug</label>
          <input className="input" value={tenant.slug} disabled />
        </div>
        <div>
          <label className="label">Fidelizacion: cada N citas</label>
          <input
            className="input"
            type="number"
            min="1"
            value={tenant.loyaltyEvery}
            onChange={(e) => update('loyaltyEvery', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Descuento (%)</label>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            value={tenant.loyaltyDiscount}
            onChange={(e) => update('loyaltyDiscount', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Tasa CUP por USD</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={tenant.ratesCupPerUsd ?? ''}
            onChange={(e) =>
              update('ratesCupPerUsd', e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
        <div>
          <label className="label">Tasa MLC por USD</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={tenant.ratesMlcPerUsd ?? ''}
            onChange={(e) =>
              update('ratesMlcPerUsd', e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
      </div>

      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}

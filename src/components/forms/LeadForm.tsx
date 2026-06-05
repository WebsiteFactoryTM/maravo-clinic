'use client'

import React, { useActionState, useEffect, useId, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { submitLead, type SubmitLeadResult } from '@/app/(frontend)/actions/submit-lead'

export interface ProcedureOption {
  id: number
  title: string
}

interface LeadFormProps {
  source?: string
  /** When set, the form submits this procedure id and shows a context note. */
  procedureInterestId?: number
  procedureTitle?: string
  /** Optional list to render a procedure <select> when no id is prefilled. */
  procedureOptions?: ProcedureOption[]
}

type FormState = SubmitLeadResult | { ok: null }

const initialState: FormState = { ok: null }

async function action(_prev: FormState, formData: FormData): Promise<FormState> {
  return submitLead(formData)
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-dark lead-form__submit" disabled={pending}>
      {pending ? 'Se trimite…' : 'Trimite solicitarea'}
    </button>
  )
}

export default function LeadForm({
  source = '/contact',
  procedureInterestId,
  procedureTitle,
  procedureOptions,
}: LeadFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(action, initialState)
  const formId = useId()
  const successRef = useRef<HTMLDivElement>(null)

  const errors = state.ok === false ? state.errors : undefined

  useEffect(() => {
    if (state.ok === true && successRef.current) {
      successRef.current.focus()
    }
  }, [state.ok])

  if (state.ok === true) {
    return (
      <div
        className="lead-form__success"
        role="status"
        aria-live="polite"
        tabIndex={-1}
        ref={successRef}
      >
        <p>Vă mulțumim! Vă contactăm în curând.</p>
      </div>
    )
  }

  const fieldError = (name: 'name' | 'phone' | 'email' | 'message') => errors?.[name]?.[0]

  return (
    <form action={formAction} className="lead-form" noValidate aria-describedby={`${formId}-intro`}>
      <p id={`${formId}-intro`} className="lead-form__intro">
        Completați formularul și vă contactăm pentru o programare.
      </p>

      {procedureTitle && procedureInterestId ? (
        <p className="lead-form__note" role="note">
          Solicitare pentru: <strong>{procedureTitle}</strong>
        </p>
      ) : null}

      <div className="lead-form__field">
        <label htmlFor={`${formId}-name`}>
          Nume <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${formId}-name`}
          name="name"
          type="text"
          required
          autoComplete="name"
          aria-required="true"
          aria-invalid={fieldError('name') ? 'true' : undefined}
          aria-describedby={fieldError('name') ? `${formId}-name-err` : undefined}
        />
        {fieldError('name') && (
          <span id={`${formId}-name-err`} className="lead-form__error" role="alert">
            {fieldError('name')}
          </span>
        )}
      </div>

      <div className="lead-form__field">
        <label htmlFor={`${formId}-phone`}>
          Telefon <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${formId}-phone`}
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          aria-required="true"
          aria-invalid={fieldError('phone') ? 'true' : undefined}
          aria-describedby={fieldError('phone') ? `${formId}-phone-err` : undefined}
        />
        {fieldError('phone') && (
          <span id={`${formId}-phone-err`} className="lead-form__error" role="alert">
            {fieldError('phone')}
          </span>
        )}
      </div>

      <div className="lead-form__field">
        <label htmlFor={`${formId}-email`}>Email</label>
        <input
          id={`${formId}-email`}
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={fieldError('email') ? 'true' : undefined}
          aria-describedby={fieldError('email') ? `${formId}-email-err` : undefined}
        />
        {fieldError('email') && (
          <span id={`${formId}-email-err`} className="lead-form__error" role="alert">
            {fieldError('email')}
          </span>
        )}
      </div>

      {procedureInterestId ? (
        <input type="hidden" name="procedureInterest" value={String(procedureInterestId)} />
      ) : procedureOptions && procedureOptions.length > 0 ? (
        <div className="lead-form__field">
          <label htmlFor={`${formId}-procedure`}>Procedură de interes</label>
          <select id={`${formId}-procedure`} name="procedureInterest" defaultValue="">
            <option value="">Selectați (opțional)</option>
            {procedureOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="lead-form__field">
        <label htmlFor={`${formId}-message`}>Mesaj</label>
        <textarea id={`${formId}-message`} name="message" rows={4} />
      </div>

      {/* Honeypot — visually hidden off-screen (not display:none), hidden from AT. */}
      <div className="lead-form__hp" aria-hidden="true">
        <label htmlFor={`${formId}-company`}>Companie (nu completați)</label>
        <input
          id={`${formId}-company`}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <input type="hidden" name="source" value={source} />

      <SubmitButton />
    </form>
  )
}

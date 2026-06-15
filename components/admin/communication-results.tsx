"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  collectEmailsForCopy,
  collectPhonesForCopy,
} from "@/lib/communication/filter-targeted-members";
import {
  formatEmailsDisplay,
  formatPhonesDisplay,
} from "@/lib/contacts/person-contacts";
import type { CommunicationChannel, TargetedMember } from "@/types/communication";

type CommunicationResultsProps = {
  members: TargetedMember[];
  channel: CommunicationChannel;
  labels: {
    resultsTitle: string;
    resultCount: string;
    empty: string;
    lastName: string;
    firstName: string;
    email: string;
    phone: string;
    household: string;
    copyEmails: string;
    copyPhones: string;
    sendEmail: string;
    copySuccessEmails: string;
    copySuccessPhones: string;
    copyError: string;
  };
};

export function CommunicationResults({
  members,
  channel,
  labels,
}: CommunicationResultsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emails = collectEmailsForCopy(members);
  const phones = collectPhonesForCopy(members);
  const isEmailChannel = channel === "email";

  async function handleCopyEmails() {
    setMessage(null);
    setError(null);

    if (emails.length === 0) return;

    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setMessage(labels.copySuccessEmails);
    } catch {
      setError(labels.copyError);
    }
  }

  async function handleCopyPhones() {
    setMessage(null);
    setError(null);

    if (phones.length === 0) return;

    try {
      await navigator.clipboard.writeText(phones.join(", "));
      setMessage(labels.copySuccessPhones);
    } catch {
      setError(labels.copyError);
    }
  }

  function handleSendEmail() {
    if (emails.length === 0) return;
    const bcc = encodeURIComponent(emails.join(","));
    window.location.href = `mailto:?bcc=${bcc}`;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">
              {labels.resultsTitle}
            </p>
            <p className="mt-1 text-sm text-muted">
              {labels.resultCount}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isEmailChannel ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={emails.length === 0}
                  onClick={handleCopyEmails}
                >
                  {labels.copyEmails}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={emails.length === 0}
                  onClick={handleSendEmail}
                >
                  {labels.sendEmail}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={phones.length === 0}
                onClick={handleCopyPhones}
              >
                {labels.copyPhones}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <Alert variant="success" className="text-sm">
            {message}
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="error" className="text-sm">
            {error}
          </Alert>
        ) : null}

        {members.length === 0 ? (
          <p className="text-sm text-muted">{labels.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    {labels.lastName}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    {labels.firstName}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    {labels.email}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    {labels.phone}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    {labels.household}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {member.lastName}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {member.firstName}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatEmailsDisplay(member.emails)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatPhonesDisplay(member.phones)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {member.householdName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

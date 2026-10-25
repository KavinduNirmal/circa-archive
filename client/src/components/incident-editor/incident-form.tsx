"use client";
import { useId } from "react";
import { useTranslations } from "next-intl";
import {
  SEVERITIES,
  WARNING_TAGS,
  type IncidentDraft,
} from "@/lib/incident-editor/model";
import { ArchiveButton } from "../archive-site/archive-button";
import styles from "./editor.module.css";

export function IncidentForm({
  draft,
  onChange,
  onContinue,
}: {
  draft: IncidentDraft;
  onChange: (draft: IncidentDraft) => void;
  onContinue: () => void;
}) {
  const t = useTranslations("editor");
  const uid = useId();
  const { form } = draft;
  const set = <K extends keyof IncidentDraft["form"]>(
    key: K,
    value: IncidentDraft["form"][K],
  ) => onChange({ ...draft, form: { ...form, [key]: value } });
  const setWarningTag = (tag: string, checked: boolean) => {
    const warningTags = checked
      ? [...form.warningTags, tag]
      : form.warningTags.filter((value) => value !== tag);
    onChange({
      ...draft,
      form: {
        ...form,
        warningTags,
        warning: warningTags.length ? "provided" : "unspecified",
      },
    });
  };
  const setWarningDisclosure = (
    warning: "noWarningsApply" | "unspecified",
    checked: boolean,
  ) => {
    onChange({
      ...draft,
      form: {
        ...form,
        warning: checked ? warning : "provided",
        warningTags: checked ? [] : form.warningTags,
      },
    });
  };
  return (
    <div className={styles.form}>
      <div className={styles.sectionTitle}>
        <span>01 / INC</span>
        <h2>{t("formTitle")}</h2>
        <p>{t("formHint")}</p>
      </div>
      <div className={styles.field}>
        <label htmlFor={`${uid}-designation`}>{t("designation")}</label>
        <p id={`${uid}-designation-hint`}>{t("designationHint")}</p>
        <input
          id={`${uid}-designation`}
          aria-describedby={`${uid}-designation-hint`}
          maxLength={256}
          value={form.designation}
          onChange={(event) => set("designation", event.target.value)}
        />
        <small className={styles.counter}>
          {form.designation.length} / 256
        </small>
      </div>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor={`${uid}-severity`}>{t("severity")}</label>
          <select
            id={`${uid}-severity`}
            value={form.severity}
            onChange={(event) => set("severity", event.target.value)}
          >
            {SEVERITIES.map((value) => (
              <option key={value} value={value}>
                {t(`severity${value}`)}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${uid}-clearance`}>{t("clearance")}</label>
          <select
            id={`${uid}-clearance`}
            value={form.clearance}
            onChange={(event) => set("clearance", event.target.value)}
          >
            {[3, 4, 5, 6].map((level) => (
              <option key={level} value={level}>
                {t("level", { level })}
              </option>
            ))}
          </select>
          <p>{t("clearanceHint")}</p>
        </div>
        {(["affiliation", "claimant"] as const).map((key) => (
          <div key={key} className={styles.field}>
            <label htmlFor={`${uid}-${key}`}>{t(key)}</label>
            <input
              id={`${uid}-${key}`}
              value={form[key]}
              onChange={(event) => set(key, event.target.value)}
            />
            <p>{t("organizationHint")}</p>
          </div>
        ))}
      </div>
      <div className={styles.field}>
        <label htmlFor={`${uid}-access`}>{t("access")}</label>
        <select
          id={`${uid}-access`}
          value={form.access}
          onChange={(event) =>
            set("access", event.target.value as "public" | "sealed")
          }
        >
          <option value="public">{t("public")}</option>
          <option value="sealed">{t("sealed")}</option>
        </select>
        <p>{t("restrictedAccess")}</p>
      </div>
      <fieldset className={`${styles.field} ${styles.warningField}`}>
        <legend>{t("warnings")}</legend>
        <p>{t("warningHint")}</p>
        <div className={styles.checks}>
          {WARNING_TAGS.map((tag) => (
            <label key={tag}>
              <input
                type="checkbox"
                checked={form.warningTags.includes(tag)}
                onChange={(event) => setWarningTag(tag, event.target.checked)}
              />
              {t(`tag${tag}`)}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={form.warning === "noWarningsApply"}
              onChange={(event) =>
                setWarningDisclosure("noWarningsApply", event.target.checked)
              }
            />
            {t("warningNoWarningsApply")}
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.warning === "unspecified"}
              onChange={(event) =>
                setWarningDisclosure("unspecified", event.target.checked)
              }
            />
            {t("warningUnspecified")}
          </label>
        </div>
      </fieldset>
      <div className={styles.field}>
        <label htmlFor={`${uid}-tags`}>{t("tags")}</label>
        <input
          id={`${uid}-tags`}
          value={form.tags}
          onChange={(event) => set("tags", event.target.value)}
        />
        <p>{t("tagsHint")}</p>
      </div>
      <div className={styles.formFoot}>
        <ArchiveButton tone="paper" onClick={onContinue}>
          {t("continue")} <span aria-hidden="true">→</span>
        </ArchiveButton>
      </div>
    </div>
  );
}

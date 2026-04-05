import type {
  AccountCheckStatus,
  AccountRuntimeStatus,
  AccountStockStatus,
  CardStatus,
} from "@/lib/types";

type StatusMeta = {
  label: string;
  tone: string;
};

export function getAccountCheckStatusMeta(
  status: AccountCheckStatus,
): StatusMeta {
  if (status === "ok") {
    return {
      label: "正常",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "banned") {
    return {
      label: "已封禁",
      tone: "border-red-200 bg-red-50 text-red-700",
    };
  }

  return {
    label: "待确认",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  };
}

export function getAccountStockStatusMeta(
  status: AccountStockStatus,
): StatusMeta {
  if (status === "available") {
    return {
      label: "可发放",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "bound") {
    return {
      label: "已绑定",
      tone: "border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  return {
    label: "已停用",
    tone: "border-stone-200 bg-stone-100 text-stone-600",
  };
}

export function getAccountRuntimeStatusMeta(
  status: AccountRuntimeStatus,
): StatusMeta {
  if (status === "ok") {
    return {
      label: "实时正常",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "banned") {
    return {
      label: "实时封禁",
      tone: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (status === "invalid") {
    return {
      label: "凭证失效",
      tone: "border-orange-200 bg-orange-50 text-orange-700",
    };
  }

  return {
    label: "实时待确认",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  };
}

export function getCardStatusMeta(status: CardStatus): StatusMeta {
  if (status === "normal") {
    return {
      label: "正常",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "已停用",
    tone: "border-stone-200 bg-stone-100 text-stone-600",
  };
}

export function getBindingStateMeta(input: {
  hasActiveBinding: number;
  hasBindings: number;
  accountCheckStatus?: AccountCheckStatus | null;
  deliveryRef?: string | null;
}): StatusMeta {
  if (input.hasActiveBinding) {
    const accountStatus = input.accountCheckStatus
      ? getAccountCheckStatusMeta(input.accountCheckStatus)
      : null;

    return {
      label: accountStatus?.label
        ? `使用中 · ${accountStatus.label}`
        : "使用中",
      tone: accountStatus?.tone ?? "border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  if (input.hasBindings) {
    return {
      label: "有历史记录",
      tone: "border-stone-200 bg-stone-100 text-stone-600",
    };
  }

  if (input.deliveryRef) {
    return {
      label: "已发货待兑换",
      tone: "border-violet-200 bg-violet-50 text-violet-700",
    };
  }

  return {
    label: "库存中",
    tone: "border-stone-200 bg-white text-stone-600",
  };
}

export function formatQuotaValue(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function isLiveCheckSupportedPoolCode(poolCode: string) {
  return poolCode.trim().toLowerCase().startsWith("kiro");
}

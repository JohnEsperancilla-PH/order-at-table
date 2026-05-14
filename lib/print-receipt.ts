import { format } from 'date-fns'
import type { Order, Restaurant } from '@/lib/types'

type ReceiptOrderItem = {
  id?: string
  quantity?: number
  price?: number
  special_instructions?: string | null
  menu_items?: { name?: string | null } | null
  menu_item_modifiers?: { name?: string | null } | null
  [key: string]: unknown
}

type ReceiptOrder = Order & {
  tables?: { table_number?: string } | null
  order_items?: ReceiptOrderItem[]
}

type ReceiptRestaurant = Pick<
  Restaurant,
  'name' | 'contact_number' | 'description'
> & {
  address?: string | null
}

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))
}

function statusLabel(status: string): string {
  switch (status) {
    case 'awaiting_cashier_confirmation':
      return 'Awaiting Payment'
    case 'pending':
      return 'Pending'
    case 'confirmed':
      return 'Confirmed'
    case 'ready_for_pickup':
      return 'Ready for Pickup'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status.replace(/_/g, ' ').toUpperCase()
  }
}

export function buildReceiptHTML(
  order: ReceiptOrder,
  restaurant: ReceiptRestaurant | null,
): string {
  const tableNumber = order.tables?.table_number
  const isCounter = !order.customer_session_id
  const items = order.order_items ?? []
  const reprintCount = order.receipt_resent_count ?? 0
  const isReprint = reprintCount > 0
  const isPaid = !!order.payment_verified_at
  const createdAt = new Date(order.created_at)
  const printedAt = new Date()

  const restaurantName = restaurant?.name ?? 'Receipt'
  const contact = restaurant?.contact_number ?? ''
  const address = restaurant?.address ?? ''

  const itemsHTML = items
    .map((item) => {
      const name = item.menu_items?.name ?? 'Item'
      const modifier = item.menu_item_modifiers?.name ?? ''
      const note = (item.special_instructions ?? '').trim()
      const qty = Number(item.quantity || 0)
      const unit = Number(item.price || 0)
      const lineTotal = qty * unit

      return `
        <div class="item">
          <div class="item-row">
            <span class="item-qty">${qty}&times;</span>
            <span class="item-name">${escapeHtml(name)}</span>
            <span class="item-total">${formatMoney(lineTotal)}</span>
          </div>
          ${
            modifier
              ? `<div class="item-sub">+ ${escapeHtml(modifier)}</div>`
              : ''
          }
          ${
            note
              ? `<div class="item-note">&raquo; ${escapeHtml(note)}</div>`
              : ''
          }
        </div>
      `
    })
    .join('')

  const subtotal = Number(order.subtotal ?? 0)
  const discount = Number(order.discount_amount ?? 0)
  const total = Number(order.total_amount ?? 0)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(order.confirmation_code)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: 'Courier New', 'Consolas', ui-monospace, monospace;
      font-size: 12px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt {
      width: 76mm;
      max-width: 76mm;
      margin: 0 auto;
      padding: 6mm 4mm;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    .muted { color: #444; }
    .uppercase { text-transform: uppercase; letter-spacing: 0.04em; }
    .divider {
      border: 0;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .double {
      border: 0;
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    .brand {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .code {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.08em;
      margin: 4px 0 2px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .label { color: #444; }
    .item { margin: 4px 0; }
    .item-row {
      display: grid;
      grid-template-columns: 24px 1fr auto;
      gap: 6px;
      align-items: baseline;
    }
    .item-qty { font-weight: 700; }
    .item-name { word-break: break-word; }
    .item-total { font-variant-numeric: tabular-nums; }
    .item-sub, .item-note {
      padding-left: 30px;
      font-size: 11px;
      color: #222;
    }
    .item-note { font-style: italic; }
    .totals { margin-top: 4px; }
    .total-line {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-variant-numeric: tabular-nums;
    }
    .grand {
      font-size: 14px;
      font-weight: 800;
      padding: 4px 0;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 6px;
      justify-content: center;
      margin: 4px 0 0;
    }
    .badge {
      display: inline-block;
      border: 1px solid #000;
      padding: 1px 6px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 11px;
    }
    .printed {
      margin-top: 6px;
      font-size: 10px;
      color: #444;
      text-align: center;
    }

    @page { size: 80mm auto; margin: 0; }
    @media print {
      html, body { width: 80mm; }
      .receipt { padding: 4mm 3mm; }
    }
    @media screen {
      body {
        background: #f2f2f2;
        padding: 24px 0;
      }
      .receipt {
        background: #fff;
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        border-radius: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="brand">${escapeHtml(restaurantName)}</div>
      ${address ? `<div class="muted">${escapeHtml(address)}</div>` : ''}
      ${contact ? `<div class="muted">${escapeHtml(contact)}</div>` : ''}
    </div>

    <hr class="divider" />

    <div class="center">
      <div class="muted uppercase" style="font-size:10px">Order Receipt</div>
      <div class="code">${escapeHtml(order.confirmation_code)}</div>
      <div class="muted">${escapeHtml(format(createdAt, 'MMM d, yyyy · h:mm a'))}</div>
    </div>

    <hr class="divider" />

    <div class="meta-row"><span class="label">Source</span><span class="bold">${
      isCounter ? 'Counter' : 'Table'
    }</span></div>
    ${
      tableNumber
        ? `<div class="meta-row"><span class="label">Table</span><span class="bold">${escapeHtml(
            tableNumber,
          )}</span></div>`
        : ''
    }
    ${
      order.customer_name
        ? `<div class="meta-row"><span class="label">Customer</span><span class="bold">${escapeHtml(
            order.customer_name,
          )}</span></div>`
        : ''
    }
    <div class="meta-row"><span class="label">Status</span><span class="bold">${escapeHtml(
      statusLabel(order.status),
    )}</span></div>

    <hr class="divider" />

    ${itemsHTML || '<div class="muted center">No items</div>'}

    <hr class="divider" />

    <div class="totals">
      <div class="total-line"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
      ${
        discount > 0
          ? `<div class="total-line"><span>Discount</span><span>-${formatMoney(
              discount,
            )}</span></div>`
          : ''
      }
      <hr class="double" />
      <div class="total-line grand"><span>TOTAL</span><span>${formatMoney(total)}</span></div>
    </div>

    <div class="badges">
      ${isPaid ? '<span class="badge">PAID</span>' : ''}
      ${isReprint ? `<span class="badge">REPRINT #${reprintCount + 1}</span>` : ''}
    </div>

    <hr class="divider" />

    <div class="footer bold">Thank you!</div>
    <div class="printed">Printed ${escapeHtml(format(printedAt, 'MMM d, yyyy · h:mm a'))}</div>
  </div>
</body>
</html>`
}

/**
 * Open a hidden iframe with the receipt HTML and trigger the browser print dialog.
 * The OS print dialog targets any paired system printer (including Bluetooth thermal
 * printers paired through the OS).
 */
export function printReceipt(
  order: ReceiptOrder,
  restaurant: ReceiptRestaurant | null,
): void {
  if (typeof window === 'undefined') return

  const html = buildReceiptHTML(order, restaurant)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('title', 'Receipt print preview')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'

  document.body.appendChild(iframe)

  const doc =
    iframe.contentDocument || iframe.contentWindow?.document || null

  if (!doc) {
    iframe.remove()
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      // Some browsers throw if print is blocked; ignore.
    }
    window.setTimeout(() => {
      try {
        iframe.remove()
      } catch {
        // already detached
      }
    }, 1000)
  }

  // Allow the iframe to layout before printing.
  if (iframe.contentWindow) {
    window.setTimeout(triggerPrint, 100)
  } else {
    iframe.addEventListener('load', triggerPrint, { once: true })
  }
}

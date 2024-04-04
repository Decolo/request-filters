import { useEffect, useMemo, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table"
import { cn, parsedBody } from "~/lib/utils"

import "~/global.css"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table"
import { useDebounce } from "ahooks"
import { useStorage } from "@plasmohq/storage/hook"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type UrlInfo = {
  url: string
  method: string
  body?: string
}

export const columns: ColumnDef<UrlInfo>[] = [
  {
    accessorKey: "url",
    header: "url"
  },
  {
    accessorKey: "method",
    header: "method"
  },
  {
    accessorKey: "body",
    header: "body"
  }
]

function IndexPopup() {
  const [urlInfos, setUrlInfos] = useState<UrlInfo[]>([])
  const [input, setInput] = useStorage("input", "events")
  const debouncedInput = useDebounce(input, { wait: 400 })

  console.log('** log input **', input)

  const filteredUrlInfos = useMemo(() => {
    if (!debouncedInput) {
      return urlInfos
    }

    return urlInfos.filter((url) => url.url.includes(debouncedInput))
  }, [urlInfos, debouncedInput])

  const table = useReactTable({
    data: filteredUrlInfos,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  useEffect(() => {
    const handler = (details: chrome.webRequest.WebRequestBodyDetails) => {
      let urlInfo = {
        url: details.url,
        method: details.method
      }

      if (
        details.method === "POST" ||
        (details.method === "PUT" &&
          details?.requestBody?.raw?.[0]?.bytes.byteLength)
      ) {
        const bodyString = parsedBody(details.requestBody.raw[0].bytes)

        urlInfo["body"] = bodyString
      }

      setUrlInfos((urls) => [...urls, urlInfo])
    }

    chrome.webRequest.onBeforeRequest.addListener(
      handler,
      {
        urls: ["<all_urls>"]
      },
      ["requestBody"]
    )

    return () => {
      chrome.webRequest.onBeforeRequest.removeListener(handler)
    }
  }, [])

  return (
    <Card className={cn("w-[1020px]")}>
      <CardHeader>
        <CardTitle>All urls</CardTitle>
        <CardDescription>All url list below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input placeholder="input" value={input} onChange={(e) => setInput(e.target.value)} />

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow key={index}>
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell key={index}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* <CardHeader>
        <CardTitle>Amplitude</CardTitle>
      </CardHeader>
      <CardContent>
        <iframe
          src="https://app.amplitude.com/analytics/jobright/home"
          width={"100%"}></iframe>
      </CardContent> */}
    </Card>
  )
}

export default IndexPopup

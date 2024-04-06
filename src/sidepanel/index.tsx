import { useEffect, useMemo, useState } from "react"

import "@radix-ui/themes/styles.css"

import {
  Box,
  Card,
  Code,
  Flex,
  Heading,
  Table,
  Text,
  TextField,
  Theme
} from "@radix-ui/themes"

import { cn, parsedBody } from "~/lib/utils"

import "~/global.css"

import { useDebounce, useUpdateEffect } from "ahooks"
import Highlighter from "react-highlight-words"

import { useStorage } from "@plasmohq/storage/hook"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type UrlInfo = {
  url: string
  method: string
  body?: string
}

function IndexPopup() {
  const [urlInfos, setUrlInfos] = useState<UrlInfo[]>([])
  const [storageUrlInput, setStorageUrlInput] = useStorage("url-input", "events")
  const [urlInput, setUrlInput] = useState(storageUrlInput)
  
  const [storageBodyInput, setStorageBodyInput] = useStorage("body-input", "")
  const [bodyInput, setBodyInput] = useState(storageBodyInput)

  const debouncedUrlInput = useDebounce(urlInput, { wait: 400 })
  const debouncedBodyInput = useDebounce(bodyInput, { wait: 400 })

  useUpdateEffect(() => {
    setStorageUrlInput(debouncedUrlInput);
  }, [debouncedUrlInput])

  useUpdateEffect(() => {
    setStorageBodyInput(debouncedBodyInput);
  }, [debouncedBodyInput])

  const filteredUrlInfos = useMemo(() => {
    if (!debouncedUrlInput) {
      return []
    }

    return urlInfos.filter((url) => url.url.includes(debouncedUrlInput))
  }, [urlInfos, debouncedUrlInput])

  useEffect(() => {
    const requestHandler = (
      details: chrome.webRequest.WebRequestBodyDetails
    ) => {
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

        let formattedBodyString
        try {
          const body = JSON.parse(bodyString)
          formattedBodyString = JSON.stringify(body, null, 2)
        } catch (e) {
          formattedBodyString = ""
        }

        urlInfo["body"] = formattedBodyString
      }

      setUrlInfos((urls) => [...urls, urlInfo])
    }

    const tabHandler = (tabId, changeInfo, tab) => {
      if (changeInfo.status === "loading") {
        setUrlInfos([])
      }
    }

    chrome.webRequest.onBeforeRequest.addListener(
      requestHandler,
      {
        urls: ["<all_urls>"]
      },
      ["requestBody"]
    )

    chrome.tabs.onUpdated.addListener(tabHandler)

    return () => {
      chrome.webRequest.onBeforeRequest.removeListener(requestHandler)
      chrome.tabs.onUpdated.removeListener(tabHandler)
    }
  }, [])

  return (
    <Theme>
      <Box className={cn("w-[1020px]", "text-xs")}>
        <Heading size="3" className="p-2">
          All requests list below.
        </Heading>
        <div className="p-2">
          <Flex gap="4" align={"center"} className="p-2">
            <Heading size="1">URL: </Heading>
            <TextField.Root
              size="2"
              placeholder="input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </Flex>

          <Flex gap="2" align={"center"} className="p-2">
            <Heading size="1">Body: </Heading>
            <TextField.Root
              size="2"
              placeholder="input"
              value={bodyInput}
              onChange={(e) => setBodyInput(e.target.value)}
            />
          </Flex>

          <Table.Root size={"1"}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell className="w-1">
                  url
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="w-1">
                  method
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell className="w-1">
                  body
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {filteredUrlInfos.map((info) => (
                <Table.Row>
                  <Table.Cell className="w-1" style={{ whiteSpace: "pre" }}>
                    <Highlighter
                      searchWords={[debouncedBodyInput]}
                      autoEscape={true}
                      textToHighlight={info.body}
                    />
                    
                  </Table.Cell>
                  <Table.Cell className="w-1">{info.url}</Table.Cell>
                  <Table.Cell className="w-1">{info.method}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </div>
      </Box>
    </Theme>
  )
}

export default IndexPopup

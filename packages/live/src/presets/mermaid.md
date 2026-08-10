## Mermaid.js Support

::: mermaid

graph TD
  Start((Start)) --> Process1[Process One]
  Process1 --> Decision{Is it valid?}
  Decision -- No --> Error[Error Handling]
  Decision -- Yes --> Process2[Process Two]
  Process2 --> Subgraph1
  subgraph Subgraph1 [Critical Path]
  Step1[Step 1] --> Step2[Step 2]
  end
  Step2 --> End((End))
  Error --> End

::: /mermaid
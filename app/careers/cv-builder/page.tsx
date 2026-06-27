"use client"

import { useState } from "react"

export default function CVBuilder() {

const [step,setStep]=useState(1)

const [role,setRole]=useState("")

const [method,setMethod]=useState<"upload"|"manual"|null>(null)

const [fileName,setFileName]=useState("")

const [cv,setCv]=useState({

about:"",

education:"",

experience:"",

skills:"",

summary:""

})

function generateCV(){

const text=`

PROFESSIONAL SUMMARY

Motivated and adaptable professional preparing for a ${role} role.

Demonstrates strong communication, problem-solving and execution skills with the ability to contribute effectively in dynamic work environments.

ABOUT

${cv.about}

EXPERIENCE

${cv.experience}

EDUCATION

${cv.education}

KEY SKILLS

${cv.skills}

`

setCv({

...cv,

summary:text

})

setStep(4)

}

async function uploadCV(
e:any
){

const file=
e.target.files?.[0]

if(!file) return

setFileName(
file.name
)

try{

const text=
await file.text()

setCv({

...cv,

summary:text.slice(0,2500)

})

}
catch{

alert(
"Upload detected. Continue editing manually."
)

}

setStep(4)

}

return(

<div
style={{

background:"#050816",

minHeight:"100vh",

color:"white",

padding:"40px",

fontFamily:"Inter"

}}
>

<div
style={{

maxWidth:1000,

margin:"auto"

}}
>

<h1
style={{

fontSize:56,

marginBottom:10

}}
>

LaunchPad CV Builder

</h1>

<p
style={{

opacity:.7,

marginBottom:40

}}
>

Build. Apply. Calculate. Grow.

</p>

{/* STEP 1 */}

{

step===1 && (

<div
style={card}
>

<h2>

What role are you applying for?

</h2>

<input

style={input}

placeholder="Example: Customer Support Specialist"

value={role}

onChange={(e)=>

setRole(
e.target.value
)

}

/>

<button

style={primary}

onClick={()=>{

if(!role){

alert(
"Enter role first"
)

return

}

setStep(2)

}}

>

Continue

</button>

</div>

)

}

{/* STEP 2 */}

{

step===2 && (

<div
style={card}
>

<h2>

Choose how to build your CV

</h2>

<div
style={grid}
>

<button

style={option}

onClick={()=>{

setMethod(
"upload"
)

setStep(3)

}}

>

📄 Upload Existing CV

</button>

<button

style={option}

onClick={()=>{

setMethod(
"manual"
)

setStep(3)

}}

>

✏️ Build From Scratch

</button>

</div>

</div>

)

}

{/* STEP 3 */}

{

step===3 && method==="upload" && (

<div
style={card}
>

<h2>

Upload your previous CV

</h2>

<input

type="file"

accept=".pdf,.doc,.docx,.txt"

onChange={uploadCV}

/>

{

fileName && (

<p>

Uploaded:

{fileName}

</p>

)

}

</div>

)

}

{

step===3 && method==="manual" && (

<div
style={card}
>

<h2>

Answer a few questions

</h2>

<textarea

style={area}

placeholder="Tell us about yourself"

onChange={(e)=>

setCv({

...cv,

about:e.target.value

})

}

/>

<textarea

style={area}

placeholder="Education"

onChange={(e)=>

setCv({

...cv,

education:e.target.value

})

}

/>

<textarea

style={area}

placeholder="Experience"

onChange={(e)=>

setCv({

...cv,

experience:e.target.value

})

}

/>

<textarea

style={area}

placeholder="Skills"

onChange={(e)=>

setCv({

...cv,

skills:e.target.value

})

}

/>

<button

style={primary}

onClick={generateCV}

>

Generate CV

</button>

</div>

)

}

{/* STEP 4 */}

{

step===4 && (

<div
style={card}
>

<h2>

Your Tailored CV

</h2>

<p>

Role:

<b>

{role}

</b>

</p>

<textarea

style={preview}

value={cv.summary}

onChange={(e)=>

setCv({

...cv,

summary:e.target.value

})

}

/>

<div
style={grid}
>

<button
style={primary}
>

Download PDF

</button>

<button
style={secondary}
>

Download Word

</button>

<button
style={secondary}
>

Generate Cover Letter

</button>

</div>

</div>

)

}

</div>

</div>

)

}

const card={

background:"#0F172A",

padding:40,

borderRadius:28

}

const input={

width:"100%",

padding:18,

marginTop:20,

marginBottom:20,

borderRadius:14

}

const area={

...input,

height:120

}

const preview={

width:"100%",

height:450,

marginTop:20,

padding:20,

borderRadius:16

}

const grid={

display:"grid",

gridTemplateColumns:"1fr 1fr",

gap:20

}

const option={

padding:40,

borderRadius:18,

border:"none"

}

const primary={

padding:16,

borderRadius:14,

border:"none",

background:"#2563EB",

color:"white"

}

const secondary={

padding:16,

borderRadius:14,

border:"none"

}
param(
  [Parameter(Mandatory = $true)]
  [string]$EspeakExe
)

$ErrorActionPreference = "Stop"

$taskExecutable = (Resolve-Path -LiteralPath $EspeakExe).Path
$taskDataPath = Join-Path (Split-Path -Parent $taskExecutable) "espeak-ng-data"
if (-not (Test-Path -LiteralPath $taskDataPath)) {
  throw "Cannot find espeak-ng-data next to $taskExecutable"
}

$taskFfmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source
$taskOutput = Join-Path $PSScriptRoot "..\public\audio\phonemes"
$taskOutput = [System.IO.Path]::GetFullPath($taskOutput)
New-Item -ItemType Directory -Path $taskOutput -Force | Out-Null

# eSpeak's English phoneme mnemonics. These are broad UK teaching targets,
# not recordings of one named speaker or a promise of one universal accent.
$taskPhones = [ordered]@{
  "i-long" = "i:"
  "i-short" = "I"
  "e" = "E"
  "ae" = "a"
  "uh" = "V"
  "a-long" = "A:"
  "o-short" = "0"
  "aw-long" = "O:"
  "u-short" = "U"
  "u-long" = "u:"
  "er-long" = "3:"
  "schwa" = "@"
  "ei" = "eI"
  "ai" = "aI"
  "oi" = "OI"
  "ou" = "@U"
  "au" = "aU"
  "ear" = "I@"
  "air" = "e@"
  "ure" = "U@"
  "p" = "p"
  "b" = "b"
  "t" = "t"
  "d" = "d"
  "k" = "k"
  "g" = "g"
  "f" = "f"
  "v" = "v"
  "theta" = "T"
  "eth" = "D"
  "s" = "s"
  "z" = "z"
  "sh" = "S"
  "zh" = "Z"
  "h" = "h"
  "ch" = "tS"
  "j-affricate" = "dZ"
  "m" = "m"
  "n" = "n"
  "ng" = "N"
  "l" = "l"
  "r" = "r"
  "y" = "j"
  "w" = "w"
  "ts" = "ts"
  "dz" = "dz"
  "tr" = "tr"
  "dr" = "dr"
}

$taskOldDataPath = $env:ESPEAK_DATA_PATH
$env:ESPEAK_DATA_PATH = $taskDataPath
try {
  foreach ($taskEntry in $taskPhones.GetEnumerator()) {
    $taskWav = Join-Path ([System.IO.Path]::GetTempPath()) ("basic850-phoneme-{0}.wav" -f $taskEntry.Key)
    $taskMp3 = Join-Path $taskOutput ("{0}.mp3" -f $taskEntry.Key)
    & $taskExecutable "--path=$taskDataPath" -v en-gb -s 105 -p 45 -w $taskWav ("[[{0}]]" -f $taskEntry.Value)
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $taskWav)) {
      throw "eSpeak failed for $($taskEntry.Key)"
    }
    & $taskFfmpeg -y -v error -i $taskWav -ac 1 -ar 22050 -codec:a libmp3lame -b:a 64k $taskMp3
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $taskMp3)) {
      throw "ffmpeg failed for $($taskEntry.Key)"
    }
    Remove-Item -LiteralPath $taskWav
  }
}
finally {
  $env:ESPEAK_DATA_PATH = $taskOldDataPath
}

Write-Output ("Generated {0} phoneme clips in {1}" -f $taskPhones.Count, $taskOutput)

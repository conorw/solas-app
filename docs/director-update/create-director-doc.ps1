$ErrorActionPreference = 'Stop'

$docDir = 'C:\Projects\solas-app\docs\director-update'
$shots = Join-Path $docDir 'screenshots'
$outPath = Join-Path $docDir 'Solas-Attendance-Tracker-Update-for-Directors.docx'
$prod = 'https://app.solaswellbeing.org.uk'
$today = Get-Date -Format 'd MMMM yyyy'

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $word.Documents.Add()

function Style-Range($range, $size, $bold=$false, $italic=$false) {
	$range.Font.Name = 'Calibri'
	$range.Font.Size = $size
	$range.Font.Bold = $bold
	$range.Font.Italic = $italic
}

function Add-Para($doc, $text, $size=11, $bold=$false, $italic=$false, $spaceAfter=8, $spaceBefore=0) {
	$p = $doc.Paragraphs.Add()
	$p.Range.Text = $text
	Style-Range $p.Range $size $bold $italic
	$p.Format.SpaceAfter = $spaceAfter
	$p.Format.SpaceBefore = $spaceBefore
	$p.Range.InsertParagraphAfter() | Out-Null
}

function Add-HyperlinkLine($doc, $label, $url) {
	$p = $doc.Paragraphs.Add()
	$p.Range.Text = "$label "
	Style-Range $p.Range 11
	$r = $p.Range
	$r.Collapse(0) | Out-Null
	$doc.Hyperlinks.Add($r, $url, '', '', $url) | Out-Null
	$p.Format.SpaceAfter = 8
	$doc.Paragraphs.Last.Range.InsertParagraphAfter() | Out-Null
}

function Add-Image($doc, $file, $caption) {
	$path = Join-Path $shots $file
	$p = $doc.Paragraphs.Add()
	$pic = $doc.InlineShapes.AddPicture($path, $false, $true, $p.Range)
	$maxWidth = 430
	if ($pic.Width -gt $maxWidth) {
		$ratio = $maxWidth / $pic.Width
		$pic.Width = $maxWidth
		$pic.Height = [int]($pic.Height * $ratio)
	}
	$p.Format.SpaceAfter = 2
	$p.Range.InsertParagraphAfter() | Out-Null
	Add-Para $doc $caption 10 $false $true 14
}

try {
	$doc.PageSetup.TopMargin = 64
	$doc.PageSetup.BottomMargin = 64
	$doc.PageSetup.LeftMargin = 64
	$doc.PageSetup.RightMargin = 64

	Add-Para $doc 'Solas Attendance Tracker' 22 $true $false 4
	Add-Para $doc 'Update summary for directors' 14 $false $true 6
	Add-Para $doc "Prepared: $today" 11
	Add-Para $doc 'This note explains the main improvements in the latest development branch of the Solas Attendance Tracker, in plain language. Screenshots show the updated screens. Links point to the live production site.' 11
	Add-HyperlinkLine $doc 'Production site:' "$prod/"

	Add-Para $doc '1. At a glance' 14 $true $false 8 12
	Add-Para $doc 'This update focuses on making everyday tasks clearer and faster for staff, and giving managers richer statistics they can share.' 11
	@(
		'Clearer navigation with labelled menus (Attendance, People, Admin).',
		'Redesigned attendance screen for recording who came to which service.',
		'Improved people list and person records.',
		'Much stronger Stats area - summary cards, charts, demographics, and PDF/CSV export.',
		'Easier service list search and a clearer merge-duplicate-people flow.',
		'Polished login and password reset experience.'
	) | ForEach-Object { Add-Para $doc ("-  " + $_) 11 $false $false 4 }

	Add-Para $doc '2. Finding your way around' 14 $true $false 8 12
	Add-Para $doc 'The top bar now shows clear labels for Attendance and People. Administrators open Admin to reach Services, Stats, and Merge people - instead of relying on small icons alone.' 11
	Add-HyperlinkLine $doc 'Open the app:' "$prod/"
	Add-Image $doc '08-admin-menu.png' 'Figure 1 - Top navigation with the Admin menu open (Services, Stats, Merge people).'

	Add-Para $doc '3. Attendance' 14 $true $false 8 12
	Add-Para $doc "The attendance screen has been rebuilt so staff can pick a date, search for a person and service, and add them to the day's list. Multi-event (group) counts use simple plus/minus controls. Rows can be removed with the bin icon. On-screen messages confirm when something has been saved or changed." 11
	Add-HyperlinkLine $doc 'Attendance page:' "$prod/attendance"
	Add-Image $doc '02-attendance.png' "Figure 2 - Attendance: add attendees on the left; today's list on the right."

	Add-Para $doc '4. People' 14 $true $false 8 12
	Add-Para $doc "The people list is easier to scan, with search, a clear Add person button, and actions to edit, view history, or delete a record. Deletion also removes that person's attendance history - staff are asked to confirm first." 11
	Add-Para $doc 'Person forms are organised into clearer sections (including client agreement and acupuncture-related health flags such as epilepsy and pacemaker where relevant).' 11
	Add-HyperlinkLine $doc 'People page:' "$prod/people"
	Add-Image $doc '03-people.png' 'Figure 3 - People list with search, add, edit, history, and delete.'
	Add-Image $doc '04-person-form.png' 'Figure 4 - Person record form.'

	Add-Para $doc '5. Statistics and reporting' 14 $true $false 8 12
	Add-Para $doc 'The Stats area is the biggest reporting upgrade. Choose a From / To date range, then review:' 11
	@(
		'Summary cards - unique people, total sessions, most popular service.',
		'Charts - sessions by service and by month.',
		'Tables - breakdown by service and by person (with drill-down detail pages).',
		'Who attended - age bands, gender, town, carers, disability, marketing preferences.',
		'Referral and support - how people were referred and other support noted.'
	) | ForEach-Object { Add-Para $doc ("-  " + $_) 11 $false $false 4 }
	Add-Para $doc 'Exports: Export people (CSV), Export attendance (CSV), and Export PDF. The PDF option lets you choose which sections to include before printing or saving as a PDF - useful for board packs and funder reports.' 11
	Add-HyperlinkLine $doc 'Stats page (admin):' "$prod/admin/stats"
	Add-Image $doc '05-stats.png' 'Figure 5 - Stats dashboard with date range, exports, summary cards, and charts.'

	Add-Para $doc '6. Services' 14 $true $false 8 12
	Add-Para $doc 'Managing the list of services is cleaner, with improved search and a clear way to reset the search filter.' 11
	Add-HyperlinkLine $doc 'Services page (admin):' "$prod/admin/service"
	Add-Image $doc '06-services.png' 'Figure 6 - Services administration with search.'

	Add-Para $doc '7. Merge duplicate people' 14 $true $false 8 12
	Add-Para $doc 'If the same person was entered twice, admins can merge the duplicate into the person you want to keep. Attendance moves to the kept record. A confirmation step reduces mistakes. After a successful merge, the leftover duplicate can be removed from the people list if appropriate.' 11
	Add-HyperlinkLine $doc 'Merge people (admin):' "$prod/admin/people/merge"
	Add-Image $doc '07-merge-people.png' 'Figure 7 - Merge people: choose who to keep and which duplicate to merge.'

	Add-Para $doc '8. Sign-in and password reset' 14 $true $false 8 12
	Add-Para $doc 'The login screen and password-reset flow have been tidied so staff can sign in and set a new password more reliably.' 11
	Add-HyperlinkLine $doc 'Login:' "$prod/login"
	Add-Image $doc '01-login.png' 'Figure 8 - Login screen.'

	Add-Para $doc '9. What this means day to day' 14 $true $false 8 12
	@(
		'Frontline staff: faster, clearer attendance and people workflows.',
		'Managers / directors: richer stats and PDF/CSV exports for reporting.',
		'Admins: simpler service management and safer handling of duplicate records.'
	) | ForEach-Object { Add-Para $doc ("-  " + $_) 11 $false $false 4 }

	Add-Para $doc '10. Note on screenshots and go-live' 14 $true $false 8 12
	Add-Para $doc 'Screenshots were taken from the updated software on the development branch so you can see the new layout. Production links above are where these screens live once the update is released to https://app.solaswellbeing.org.uk/. If something on the live site still looks like the older layout, the release may not have been deployed yet.' 11

	Add-Para $doc 'Quick link list' 14 $true $false 8 12
	@(
		"Home / login - $prod/",
		"Attendance - $prod/attendance",
		"People - $prod/people",
		"Stats - $prod/admin/stats",
		"Services - $prod/admin/service",
		"Merge people - $prod/admin/people/merge"
	) | ForEach-Object { Add-Para $doc ("-  " + $_) 11 $false $false 4 }

	if (Test-Path $outPath) { Remove-Item $outPath -Force }
	$wdFormatDocumentDefault = 16
	$doc.SaveAs2([string]$outPath, $wdFormatDocumentDefault)
	Write-Output "Wrote $outPath"
}
finally {
	$doc.Close($false) | Out-Null
	$word.Quit() | Out-Null
	[System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
	[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
	[GC]::Collect()
	[GC]::WaitForPendingFinalizers()
}

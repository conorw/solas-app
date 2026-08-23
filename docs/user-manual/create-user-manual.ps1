$ErrorActionPreference = 'Stop'

$docDir = 'C:\Projects\solas-app\docs\user-manual'
$shots = Join-Path $docDir 'screenshots'
$outPath = Join-Path $docDir 'Solas-Attendance-Tracker-User-Manual.docx'
$prod = 'https://app.solaswellbeing.org.uk'
$today = Get-Date -Format 'd MMMM yyyy'

function Has-Shot($file) { Test-Path (Join-Path $shots $file) }

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
	if (-not (Test-Path $path)) {
		Add-Para $doc "[Screenshot not available: $file]" 10 $false $true 10
		return
	}
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

	# ===== COVER =====
	Add-Para $doc 'Solas Attendance Tracker' 22 $true $false 4
	Add-Para $doc 'End-user manual' 16 $false $true 6
	Add-Para $doc "Version date: $today" 11
	Add-Para $doc 'This guide explains how to use the Solas Attendance Tracker day to day: signing in, recording attendance, managing people, and (for administrators) services, statistics, and merging duplicates.' 11
	Add-HyperlinkLine $doc 'Live app:' "$prod/"

	# ===== CONTENTS =====
	Add-Para $doc 'Contents' 14 $true $false 8 12
	@(
		'1. Who this guide is for',
		'2. Getting started and signing in',
		'3. Finding your way around',
		'4. Recording attendance',
		'5. Managing people',
		'6. Admin: Services',
		'7. Admin: Stats and reports',
		'8. Admin: Merge duplicate people',
		'9. Tips and troubleshooting',
		'10. Quick links'
	) | ForEach-Object { Add-Para $doc $_ 11 $false $false 3 }

	# ===== 1 =====
	Add-Para $doc '1. Who this guide is for' 14 $true $false 8 14
	Add-Para $doc 'Most staff use Attendance and People every day. Administrators also see an Admin menu with Services, Stats, and Merge people.' 11
	Add-Para $doc 'You need a Solas login (email and password). If you do not have one, ask your administrator.' 11

	# ===== 2 =====
	Add-Para $doc '2. Getting started and signing in' 14 $true $false 8 14
	Add-Para $doc '2.1 Open the app' 12 $true $false 6 8
	Add-Para $doc 'In your browser, go to:' 11
	Add-HyperlinkLine $doc '' "$prod/"
	Add-Para $doc 'Bookmark this address so you can return quickly.' 11

	Add-Para $doc '2.2 Log in' 12 $true $false 6 8
	Add-Para $doc '1. Enter your email address.' 11 $false $false 3
	Add-Para $doc '2. Enter your password.' 11 $false $false 3
	Add-Para $doc '3. Select Login.' 11 $false $false 3
	Add-Para $doc 'You are taken to the Attendance screen.' 11
	Add-Image $doc '01-login.png' 'Figure 1 - Login screen.'

	Add-Para $doc '2.3 Forgotten password' 12 $true $false 6 8
	Add-Para $doc '1. On the login screen, choose the option to reset or recover your password.' 11 $false $false 3
	Add-Para $doc '2. Enter your email and submit the request.' 11 $false $false 3
	Add-Para $doc '3. Open the email from Solas and follow the link.' 11 $false $false 3
	Add-Para $doc '4. Choose a new password and save. You can then sign in as usual.' 11 $false $false 3
	Add-Para $doc 'If the reset link says it is invalid or expired, request a new one from the login page.' 11
	if (Has-Shot '01b-forgot-password.png') {
		Add-Image $doc '01b-forgot-password.png' 'Figure 2 - Password reset request from the login screen.'
	}

	Add-Para $doc '2.4 Log out' 12 $true $false 6 8
	Add-Para $doc 'Use Logout in the top-right of the orange bar when you finish, especially on a shared computer.' 11

	# ===== 3 =====
	Add-Para $doc '3. Finding your way around' 14 $true $false 8 14
	Add-Para $doc 'The orange bar at the top is always available once you are signed in:' 11
	Add-Para $doc '- Solas logo - returns you toward Attendance / home.' 11 $false $false 3
	Add-Para $doc '- Attendance - record who attended which service on a date.' 11 $false $false 3
	Add-Para $doc '- People - search, add, and edit person records.' 11 $false $false 3
	Add-Para $doc '- Admin (administrators only) - Services, Stats, Merge people.' 11 $false $false 3
	Add-Para $doc '- Logout - sign out.' 11 $false $false 3
	Add-Image $doc '08-admin-menu.png' 'Figure 3 - Navigation bar with Admin menu open.'

	# ===== 4 =====
	Add-Para $doc '4. Recording attendance' 14 $true $false 8 14
	Add-HyperlinkLine $doc 'Open Attendance:' "$prod/attendance"

	Add-Para $doc '4.1 Choose the date' 12 $true $false 6 8
	Add-Para $doc 'Use the date control on the left (or the arrows) to move to the day you are recording. The list on the right shows everyone already recorded for that date.' 11

	Add-Para $doc '4.2 Add a named person' 12 $true $false 6 8
	Add-Para $doc '1. In Person name, start typing and select the person from the list.' 11 $false $false 3
	Add-Para $doc '2. In Service, select the service they attended (ordinary services only - not multi-event group services).' 11 $false $false 3
	Add-Para $doc '3. Select Add to list.' 11 $false $false 3
	Add-Para $doc 'The person appears in the attendees list. A short message confirms the save.' 11
	Add-Para $doc 'If the person is not in the system yet, use Add new person, complete their details, then return and add them to attendance.' 11
	Add-Image $doc '02-attendance.png' 'Figure 4 - Attendance screen: add on the left, day list on the right.'

	Add-Para $doc '4.3 Change service or remove a row' 12 $true $false 6 8
	Add-Para $doc 'In the attendees list, use the Service dropdown on a row to correct the service. Use the bin icon to remove a mistaken entry.' 11

	Add-Para $doc '4.4 Add a multi-event (group headcount)' 12 $true $false 6 8
	Add-Para $doc 'Some services are set up as multi-event (anonymous group counts, e.g. a drop-in or large group where you only need a number).' 11
	Add-Para $doc '1. Select Add multi event.' 11 $false $false 3
	Add-Para $doc '2. Choose the multi service and the number of people.' 11 $false $false 3
	Add-Para $doc '3. Confirm to add it to the day list.' 11 $false $false 3
	Add-Para $doc 'On the list, use + / - to adjust the headcount later if needed.' 11
	if (Has-Shot '02b-multi-event-dialog.png') {
		Add-Image $doc '02b-multi-event-dialog.png' 'Figure 5 - Add multi event dialog.'
	}

	# ===== 5 =====
	Add-Para $doc '5. Managing people' 14 $true $false 8 14
	Add-HyperlinkLine $doc 'Open People:' "$prod/people"

	Add-Para $doc '5.1 Search the list' 12 $true $false 6 8
	Add-Para $doc 'Type in Search to filter by name or birth year. Clear the search (X or Clear search) to see everyone again. The count on the right shows how many matches you have.' 11
	Add-Image $doc '03-people.png' 'Figure 6 - People list.'

	Add-Para $doc '5.2 Add a person' 12 $true $false 6 8
	Add-Para $doc '1. Select Add person (or Add new person from Attendance).' 11 $false $false 3
	Add-Para $doc '2. Complete at least First name and Last name (required).' 11 $false $false 3
	Add-Para $doc '3. Fill in other sections as needed (see below).' 11 $false $false 3
	Add-Para $doc '4. Select Save.' 11 $false $false 3
	Add-Image $doc '04a-add-person.png' 'Figure 7 - Add person form.'

	Add-Para $doc '5.3 Edit a person' 12 $true $false 6 8
	Add-Para $doc 'From the people list, select the name or Edit. Update fields and Save. Use Back to return without saving.' 11
	Add-Image $doc '04-person-form.png' 'Figure 8 - Edit person form.'

	Add-Para $doc '5.4 What the form sections mean' 12 $true $false 6 8
	Add-Para $doc 'Basics - name, date of birth, gender.' 11 $false $false 3
	Add-Para $doc 'Contact - phone, email, town, postcode.' 11 $false $false 3
	Add-Para $doc 'Referral and support - how they heard about Solas, other support organisations, other info, plus flags for marketing opt out, carer, disability, and client agreement signed.' 11 $false $false 3
	Add-Para $doc 'Equality data - optional equality monitoring. Tick Equality opt out to hide those questions.' 11 $false $false 3
	Add-Para $doc 'Acupuncture - if Collect acupuncture data is ticked, health flags appear (e.g. haemophilia, pregnant, gives blood, epilepsy, pacemaker, signed).' 11 $false $false 3

	Add-Para $doc '5.5 View attendance history (admin)' 12 $true $false 6 8
	Add-Para $doc 'Administrators see a History button on each person. This opens that person''s attendance statistics for review.' 11
	if (Has-Shot '04b-person-history.png') {
		Add-Image $doc '04b-person-history.png' 'Figure 9 - Person attendance history (admin).'
	}

	Add-Para $doc '5.6 Delete a person' 12 $true $false 6 8
	Add-Para $doc 'Use the bin icon on a row. You will be asked to confirm. Deleting a person also removes all of their attendance records. This cannot be undone - use Merge people instead if the issue is a duplicate record.' 11

	# ===== 6 =====
	Add-Para $doc '6. Admin: Services' 14 $true $false 8 14
	Add-Para $doc 'Administrators manage the catalogue of services that appear when recording attendance.' 11
	Add-HyperlinkLine $doc 'Open Services:' "$prod/admin/service"

	Add-Para $doc '6.1 Find a service' 12 $true $false 6 8
	Add-Para $doc 'Use Search to filter by name. Clear search when finished.' 11

	Add-Para $doc '6.2 Add a service' 12 $true $false 6 8
	Add-Para $doc '1. Select Add service.' 11 $false $false 3
	Add-Para $doc '2. Enter the name.' 11 $false $false 3
	Add-Para $doc '3. Tick Is current if it should be available for new attendance.' 11 $false $false 3
	Add-Para $doc '4. Tick Multi if this is a group headcount service (multi-event), not a named-person service.' 11 $false $false 3
	Add-Para $doc '5. Save.' 11 $false $false 3
	Add-Image $doc '06-services.png' 'Figure 10 - Services list.'
	if (Has-Shot '06b-add-service.png') {
		Add-Image $doc '06b-add-service.png' 'Figure 11 - Add service dialog.'
	}

	Add-Para $doc '6.3 Update flags' 12 $true $false 6 8
	Add-Para $doc 'On each row you can turn Is current and Multi on or off. Changes save immediately. Only non-multi services appear in the normal Person + Service attendance picker; multi services are used via Add multi event.' 11

	# ===== 7 =====
	Add-Para $doc '7. Admin: Stats and reports' 14 $true $false 8 14
	Add-HyperlinkLine $doc 'Open Stats:' "$prod/admin/stats"

	Add-Para $doc '7.1 Choose a date range' 12 $true $false 6 8
	Add-Para $doc 'Set From and To at the top. The page refreshes with figures for that period.' 11

	Add-Para $doc '7.2 Read the dashboard' 12 $true $false 6 8
	Add-Para $doc 'Summary cards - unique people, total sessions, most popular service.' 11 $false $false 3
	Add-Para $doc 'Sessions by service / by month - charts for quick comparison.' 11 $false $false 3
	Add-Para $doc 'By service / By person tables - click a name to open a detail page for that service or person within the same dates.' 11 $false $false 3
	Add-Para $doc 'Who attended - demographics for named people (age, gender, town, carers, disability, marketing).' 11 $false $false 3
	Add-Para $doc 'Referral and support - referral sources and other support recorded on person profiles.' 11 $false $false 3
	Add-Image $doc '05-stats.png' 'Figure 12 - Stats dashboard.'

	Add-Para $doc '7.3 Export data' 12 $true $false 6 8
	Add-Para $doc 'Export people - downloads a CSV of people records.' 11 $false $false 3
	Add-Para $doc 'Export attendance - downloads a CSV of attendance for the selected period.' 11 $false $false 3
	Add-Para $doc 'Export PDF - opens a dialog so you can tick which sections to include, then opens the browser print dialog. Choose Save as PDF (or your printer) to create a report for board packs or funders.' 11 $false $false 3
	if (Has-Shot '05b-pdf-sections.png') {
		Add-Image $doc '05b-pdf-sections.png' 'Figure 13 - Choose which sections to include in the PDF.'
	}

	# ===== 8 =====
	Add-Para $doc '8. Admin: Merge duplicate people' 14 $true $false 8 14
	Add-Para $doc 'Use this when the same person was entered twice. Merging moves all attendance from the duplicate onto the person you want to keep.' 11
	Add-HyperlinkLine $doc 'Open Merge people:' "$prod/admin/people/merge"

	Add-Para $doc '1. Under Keep (merge into), select the person who should remain.' 11 $false $false 3
	Add-Para $doc '2. Under Duplicate (merge from), select the extra record.' 11 $false $false 3
	Add-Para $doc '3. Select Merge people and confirm. This cannot be undone.' 11 $false $false 3
	Add-Para $doc '4. Attendance moves to the kept person. The duplicate still exists with no attendance - delete them from the People list if you no longer need the empty record.' 11 $false $false 3
	Add-Image $doc '07-merge-people.png' 'Figure 14 - Merge people screen.'

	# ===== 9 =====
	Add-Para $doc '9. Tips and troubleshooting' 14 $true $false 8 14
	Add-Para $doc 'I cannot see Admin - your account is not an administrator. Ask someone who is to change settings or pull reports for you.' 11 $false $false 4
	Add-Para $doc 'Add to list is greyed out - select both a person and a service (and check the date).' 11 $false $false 4
	Add-Para $doc 'Person not in the list - add them under People (or Add new person), then try attendance again.' 11 $false $false 4
	Add-Para $doc 'Wrong service type - ordinary services are for named people; multi services are for group counts via Add multi event.' 11 $false $false 4
	Add-Para $doc 'Login failed - check email/password, or use password reset. Contact an admin if you still cannot get in.' 11 $false $false 4
	Add-Para $doc 'Page looks old or missing a button - refresh the browser (Ctrl+F5). If the live site still differs from this manual, an update may not have been released yet.' 11 $false $false 4

	# ===== 10 =====
	Add-Para $doc '10. Quick links' 14 $true $false 8 14
	@(
		"Home / login - $prod/",
		"Attendance - $prod/attendance",
		"People - $prod/people",
		"Add person - $prod/people/new",
		"Stats (admin) - $prod/admin/stats",
		"Services (admin) - $prod/admin/service",
		"Merge people (admin) - $prod/admin/people/merge"
	) | ForEach-Object { Add-Para $doc ("-  " + $_) 11 $false $false 4 }

	Add-Para $doc 'Need help?' 12 $true $false 6 10
	Add-Para $doc 'For access problems or training questions, contact your Solas administrator. For technical issues with the live site, include what you were trying to do and any error message shown on screen.' 11

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

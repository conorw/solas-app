<script lang="ts">
	import Button, { Icon } from '@smui/button';
	import FormField from '@smui/form-field';
	import Textfield from '@smui/textfield';
	let email = '';
	let password = '';
	const submitForm = (event: any) => {
		let formData = new FormData();
		formData.append('email', email.trim());
		formData.append('password', password.trim());
		fetch('?/login', {
			method: 'POST',
			body: formData
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					email = '';
					password = '';
				} else {
					window.location.href = '/';
				}
			});
	};
</script>

<main style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh;">
	<img src="/logo-1.png" width="80px" alt="Solas Logo" />
	<h1>Solas Attendance Tracker</h1>
	<h2>Login</h2>

	<form on:submit|preventDefault={submitForm}>
		<FormField name="email">
			<Textfield bind:value={email} name="email" label="Email" />
		</FormField>
		<FormField name="password">
			<Textfield bind:value={password} name="password" label="Password" />
		</FormField>
		<Button type="submit">Login</Button>
	</form>
</main>

async function deletePost(button){
	const postId = button.getAttribute('data-postid');
	
	if (!confirm('Are you sure you want to delete this post?')) {
		return;
	}

	try {
		const response = await fetch(`/api/delete-post/${postId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.ok) {
			// Post deleted, remove it from the UI
			button.closest('.post-item').remove();
		} else {
			alert('Failed to delete the post');
		}
	} catch (error) {
		console.error('Error deleting post:', error);
		alert('An error occurred while deleting the post.');
	}
}

document.addEventListener("DOMContentLoaded", function () {
	const deleteButtons = document.querySelectorAll('.delete-btn');
	
	deleteButtons.forEach(button => {
		button.addEventListener('click', async function () {
			deletePost(button);
		});
	});
});
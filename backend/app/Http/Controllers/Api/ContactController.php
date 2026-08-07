<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactFeedbackMail;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'nullable|email|max:150',
            'message' => 'required|string|max:2000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // Max 5MB
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('contacts', 'public');
        }

        // 1. Save to SQLite database
        $contact = Contact::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'message' => $validated['message'],
            'image_path' => $imagePath,
        ]);

        // 2. Try sending email notification to owner
        try {
            Mail::to('keefastudys@gmail.com')->send(new ContactFeedbackMail($contact));
        } catch (\Exception $e) {
            Log::error('Failed to send contact notification email: ' . $e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Feedback received successfully!',
            'data' => $contact,
        ], 201);
    }
}


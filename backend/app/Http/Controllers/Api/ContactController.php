<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'nullable|email|max:150',
            'message' => 'required|string|max:2000',
        ]);

        $contact = Contact::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Feedback received successfully!',
            'data' => $contact,
        ], 201);
    }
}

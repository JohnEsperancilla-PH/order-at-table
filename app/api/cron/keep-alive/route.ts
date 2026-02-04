import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Perform a lightweight query to keep the database active
    const { error } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Keep-alive error:', error)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    console.error('Keep-alive exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

